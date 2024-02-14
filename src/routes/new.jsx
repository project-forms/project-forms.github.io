// @ts-check
import { useState, Suspense } from "react";
import {
  ActionList,
  Box,
  Breadcrumbs,
  Heading,
  Link,
  StyledOcticon,
  Spinner,
} from "@primer/react";
import Project from "github-project";
import Nav from "../components/Nav.jsx";
import ContentWrapper from "../components/ContentWrapper.jsx";
import NewIssueForm from "../components/NewIssueForm.jsx";
import createStore from "../lib/create-store.js";
import { CheckCircleFillIcon, XCircleFillIcon } from "@primer/octicons-react";
import {
  useNavigate,
  useParams,
  useLoaderData,
  redirect,
  defer,
  Await,
} from "react-router-dom";
import { Octokit } from "@octokit-next/core";

const SUPPORTED_PROJECT_FIELD_TYPES = [
  "TEXT",
  "NUMBER",
  "DATE",
  "SINGLE_SELECT",
  // TODO: there is a problem with Iteration fields and github-project,
  //       so for now we just remove the iteration field
  // "ITERATION",
];

const VERIFY_ACCESS_QUERY = `
  query verifyAccess($owner: String!, $repo: String!, $projectNumber: Int!) {
    repository(owner: $owner, name: $repo) {
      id
    }
    owner:repositoryOwner(login: $owner) {
      ... on ProjectV2Owner {
        project:projectV2(number: $projectNumber) {
          title
          url
          viewerCanUpdate
        }
      }
    }
  }
`;

const GET_PROJECTS_WITH_ITEMS_QUERY = `
  query getProjectWithItems($owner: String!, $number: Int!) {
    userOrOrganization: repositoryOwner(login: $owner) {
      ... on ProjectV2Owner {
        projectV2(number: $number) {
          title
          url
          fields(first: 50) {
            nodes {
              ... on ProjectV2FieldCommon {
                id
                dataType
                name
              }
              ... on ProjectV2SingleSelectField {
                options {
                  id
                  name
                }
              }
              ... on ProjectV2IterationField {
                configuration {
                  iterations {
                    id
                    title
                    duration
                    startDate
                  }
                  completedIterations {
                    id
                    title
                    duration
                    startDate
                  }
                  duration
                  startDay
                }
              }
            }
          }
        }
      }
    }
  }
`;

async function getTokenFromCookie() {
  return await createStore("token").get();
}

export const loader = async ({ params }) => {
  const { owner, repo, project_number: projectNumberString } = params;

  const token = await getTokenFromCookie();
  if (!token) {
    return redirect("/login");
  }

  try {
    const octokit = new Octokit({ auth: token });

    const parameters = {
      owner,
      repo,
      projectNumber: Number(projectNumberString),
    };

    try {
      let data = await octokit.graphql(VERIFY_ACCESS_QUERY, parameters);

      const hasRepoAccess = Boolean(data?.repository);
      const hasProjectReadAccess = Boolean(data?.owner?.project);
      const hasProjectWriteAccess = Boolean(
        data?.owner?.project?.viewerCanUpdate
      );

      const hasAccessError = !hasRepoAccess || !hasProjectWriteAccess;
      const access = {
        hasRepoAccess,
        hasProjectReadAccess,
        hasProjectWriteAccess,
      };

      if (hasAccessError) {
        throw new Error(JSON.stringify(access));
      }
    } catch (error) {
      if (!error.response?.data?.data) {
        throw error;
      }

      throw new Error(error.response.data.data);
    }

    try {
      const projectData = octokit.graphql(GET_PROJECTS_WITH_ITEMS_QUERY, {
        owner: parameters.owner,
        number: parameters.projectNumber,
      });

      return defer({
        projectData,
        token,
        user: createStore("user").get(),
      });
    } catch (error) {
      const message = error.errors ? error.errors[0].message : error.message;

      throw new Error(message);
    }
  } catch (error) {
    return redirect("/login");
  }
};

export default function NewIssuePage() {
  const { owner, repo, project_number: projectNumberString } = useParams();

  const parameters = {
    owner,
    repo,
    projectNumber: Number(projectNumberString),
  };

  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
  const [submittedIssueUrl, setSubmittedIssueUrl] = useState("");
  const [accessError, setAccessError] = useState(null);
  const navigate = useNavigate();
  const { projectData, user, token } = useLoaderData();

  return (
    <Suspense
      fallback={
        <Box mt="4" display="flex" justifyContent="center">
          <Spinner />
        </Box>
      }
    >
      <Await
        resolve={Promise.all([projectData, user])}
        errorElement={<p>Error loading package location!</p>}
      >
        {([projectData, user]) => {
          const project = projectData.userOrOrganization.projectV2;
          const { title, url } = project;
          const fields = project.fields.nodes.reduce((fields, field) => {
            if (!SUPPORTED_PROJECT_FIELD_TYPES.includes(field.dataType)) {
              return fields;
            }

            function iterationToOption(iteration) {
              return {
                id: iteration.id,
                name: iteration.id,
                humanName: `${iteration.title} (${iteration.duration} days from ${iteration.startDate}))`,
              };
            }

            return [
              ...fields,
              {
                id: field.id,
                name: field.name,
                type: field.dataType,
                options: field.options
                  ? field.options
                  : field.configuration
                  ? [
                      ...field.configuration.iterations.map(iterationToOption),
                      ...field.configuration.completedIterations.map(
                        iterationToOption
                      ),
                    ]
                  : undefined,
              },
            ];
          }, []);

          /**
           * @param {Record<string, unknown>} data
           */
          async function onSubmit(data) {
            // TODO: handle errors

            setIsSubmittingIssue(true);
            const { title, body, ...projectFields } = data;

            console.log("Creating issue ...");
            const octokit = new Octokit({ auth: token });

            // Create the issue
            const { data: issue } = await octokit.request(
              "POST /repos/{owner}/{repo}/issues",
              {
                owner: owner,
                repo: repo,
                title: String(title),
                body: String(body),
              }
            );
            console.log("Issue created: %s", issue.html_url);

            console.log("Adding issue to project ...");

            const fields = Object.fromEntries(
              Object.keys(projectFields).map((name) => [name, name])
            );
            console.log({ fields, projectFields });

            // Add the issue to the project
            const project = new Project({
              octokit,
              owner: owner,
              number: parameters.projectNumber,
              fields,
            });

            try {
              // @ts-expect-error
              await project.items.add(issue.node_id, projectFields);
            } catch (error) {
              console.error(error.details);
              throw error;
            }

            console.log("Issue added to project: %s", url);

            setSubmittedIssueUrl(issue.html_url);
          }

          return (
            <>
              <Nav
                avatarUrl={user?.avatar_url}
                onLogout={() => {
                  navigate("/login");
                }}
              />
              <Box
                sx={{
                  bg: "canvas.inset",
                  borderBottom: "1px solid",
                  borderBottomColor: "border.default",
                }}
              >
                <ContentWrapper>
                  <Breadcrumbs>
                    <Breadcrumbs.Item href={`https://github.com/${owner}`}>
                      {owner}
                    </Breadcrumbs.Item>
                    <Breadcrumbs.Item
                      href={`https://github.com/project-forms/${repo}`}
                      selected
                    >
                      {repo}
                    </Breadcrumbs.Item>
                  </Breadcrumbs>
                  <Heading sx={{ fontSize: 2 }}>
                    Submit to project{" "}
                    <Link href={url}>
                      #{parameters.projectNumber} {title}
                    </Link>
                  </Heading>
                </ContentWrapper>
              </Box>
              <NewIssueForm
                onSubmit={onSubmit}
                submittedIssueUrl={submittedIssueUrl}
                projectFields={fields}
                isSubmittingIssue={isSubmittingIssue}
              />
            </>
          );
        }}
      </Await>
    </Suspense>
  );
}
