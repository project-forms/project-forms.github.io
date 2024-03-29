import { useState, useContext, useEffect } from "react";
import {
  ActionList,
  Box,
  Breadcrumbs,
  Heading,
  Link,
  Spinner,
  StyledOcticon,
} from "@primer/react";
import Project from "github-project";
import { useErrorBoundary } from "react-error-boundary";

import { OctokitContext } from "../components/octokit-provider.js";
import Nav from "../components/Nav.jsx";
import ContentWrapper from "../components/ContentWrapper.jsx";
import NewIssueForm from "../components/NewIssueForm.jsx";
import createStore from "../lib/create-store.js";
import { CheckCircleFillIcon, XCircleFillIcon } from "@primer/octicons-react";
import { useNavigate, useParams } from "react-router-dom";

// TODO: rely on 'loaders' and 'actions'

let storeData = Promise.resolve(null);
/** @type {import('../components/octokit-provider').Store} */
let DEFAULT_STORE = {
  get() {
    return storeData;
  },
  set(data) {
    storeData = Promise.resolve(data);
  },
};

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

/**
 * @param {import("../..").NewIssuePageProps} props
 * @returns
 */
export default function NewIssuePage() {
  const { showBoundary } = useErrorBoundary();
  const { owner, repo, project_number: projectNumberString } = useParams();

  const parameters = {
    owner,
    repo,
    projectNumber: Number(projectNumberString),
  };

  const { authState, logout } = useContext(OctokitContext);
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
  const [submittedIssueUrl, setSubmittedIssueUrl] = useState("");
  const [projectData, setProjectData] = useState(null);
  const [accessError, setAccessError] = useState(null);
  const navigate = useNavigate();

  if (authState.type === "unauthenticated") {
    navigate("/login");
  }

  /**
   * @type {import("..").Store<import("..").StoreData>}
   */

  const store =
    process.env.NODE_ENV === "test"
      ? DEFAULT_STORE
      : createStore(location.pathname);

  // load form data from local store or remotely
  useEffect(
    () => {
      if (authState.type !== "authenticated") return;

      store.get().then((data) => {
        if (data) {
          setProjectData(data);
        }

        authState.octokit
          .graphql(VERIFY_ACCESS_QUERY, parameters)
          .catch((error) => {
            if (!error.response?.data?.data) {
              showBoundary(error);
              return;
            }

            return error.response.data.data;
          })
          .then((data) => {
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
              setAccessError(access);
              return;
            }

            // Retrieve all project fields and single select options
            return authState.octokit.graphql(GET_PROJECTS_WITH_ITEMS_QUERY, {
              owner: parameters.owner,
              number: parameters.projectNumber,
            });
          })
          .then((data) => {
            if (!data) return;

            // @ts-expect-error
            const project = data.userOrOrganization.projectV2;

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
                          ...field.configuration.iterations.map(
                            iterationToOption
                          ),
                          ...field.configuration.completedIterations.map(
                            iterationToOption
                          ),
                        ]
                      : undefined,
                  },
                ];
              }, []),
            };

            setProjectData(projectData);
            return store.set(projectData);
          })
          .catch((error) => {
            const message = error.errors
              ? error.errors[0].message
              : error.message;

            showBoundary(new Error(message));
          });
      });
    },
    // Note: adding `store` as dependency results in an infinite loop
    [authState]
  );

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
            {projectData && (
              <Link href={projectData.url}>
                #{projectNumber} {projectData.title}
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
            {projectData && (
              <Link href={projectData.url}>
                #{projectNumber} {projectData.title}
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
    // Create the issue
    const { data: issue } = await authState.octokit.request(
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
      octokit: authState.octokit,
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

    console.log("Issue added to project: %s", projectData?.url);

    setSubmittedIssueUrl(issue.html_url);
  }

  if (!projectData) {
    return (
      <Box mt="4" display="flex" justifyContent="center">
        <Spinner />
      </Box>
    );
  }

  return (
    <>
      <Nav
        avatarUrl={authState.user?.avatar_url}
        onLogout={() => {
          logout();
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
            <Link href={projectData?.url}>
              #{parameters.projectNumber} {projectData?.title}
            </Link>
          </Heading>
        </ContentWrapper>
      </Box>
      <NewIssueForm
        onSubmit={onSubmit}
        submittedIssueUrl={submittedIssueUrl}
        projectFields={projectData?.fields}
        isSubmittingIssue={isSubmittingIssue}
      />
    </>
  );
}
