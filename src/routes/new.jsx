// @ts-check
import { useState } from "react";
import {
  ActionList,
  Box,
  Breadcrumbs,
  Heading,
  Link,
  StyledOcticon,
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
      const data = await octokit.graphql(GET_PROJECTS_WITH_ITEMS_QUERY, {
        owner: parameters.owner,
        number: parameters.projectNumber,
      });
      // @ts-expect-error
      const project = data.userOrOrganization.projectV2;

      console.log(data.userOrOrganization);

      const projectData = {
        title: project.title,
        url: project.url,
        fields: project.fields.nodes.reduce((fields, field) => {
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
        }, []),
      };

      return { ...projectData, token, user: await createStore("user").get() };
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
  const { title, url, fields, token, user } = useLoaderData();

  /**
   * @type {import("..").Store<import("..").StoreData>}
   */

  if (accessError) {
    const { owner, repo, projectNumber } = parameters;

    return (
      <Box m="4" justifyContent="center">
        <Heading sx={{ mb: 4 }}>Access Error</Heading>

        <ActionList>
          <ActionList.Item>
            <ActionList.LeadingVisual>
              {accessError.hasRepoAccess ? (
                <StyledOcticon
                  icon={CheckCircleFillIcon}
                  size={32}
                  color="success"
                />
              ) : (
                <StyledOcticon
                  icon={XCircleFillIcon}
                  size={32}
                  color="danger"
                />
              )}
            </ActionList.LeadingVisual>
            access to{" "}
            <Link
              href={`https://github.com/${owner}/${repo}`}
            >{`${owner}/${repo}`}</Link>
          </ActionList.Item>
          <ActionList.Item>
            <ActionList.LeadingVisual>
              {accessError.hasProjectReadAccess ? (
                <StyledOcticon
                  icon={CheckCircleFillIcon}
                  size={32}
                  color="success"
                />
              ) : (
                <StyledOcticon
                  icon={XCircleFillIcon}
                  size={32}
                  color="danger"
                />
              )}
            </ActionList.LeadingVisual>
            Read access to project{" "}
            {url && (
              <Link href={url}>
                #{projectNumber} {title}
              </Link>
            )}
          </ActionList.Item>
          <ActionList.Item>
            <ActionList.LeadingVisual>
              {accessError.hasProjectWriteAccess ? (
                <StyledOcticon
                  icon={CheckCircleFillIcon}
                  size={32}
                  color="success"
                />
              ) : (
                <StyledOcticon
                  icon={XCircleFillIcon}
                  size={32}
                  color="danger"
                />
              )}
            </ActionList.LeadingVisual>
            Write access to project{" "}
            {url && (
              <Link href={url}>
                #{projectNumber} {title}
              </Link>
            )}
          </ActionList.Item>
        </ActionList>
      </Box>
    );
  }

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
}
