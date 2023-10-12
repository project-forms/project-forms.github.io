// @ts-check

import React from "react";
import { createRoot } from "react-dom/client";
import {
  ActionList,
  ActionMenu,
  Avatar,
  BaseStyles,
  Box,
  Breadcrumbs,
  Button,
  FormControl,
  Header,
  Heading,
  IconButton,
  Link,
  Select,
  Spinner,
  StyledOcticon,
  Text,
  Textarea,
  TextInput,
  ThemeProvider,
} from "@primer/react";
import {
  MarkGithubIcon,
  TableIcon,
  XCircleFillIcon,
  CheckCircleFillIcon,
} from "@primer/octicons-react";
import Project from "github-project";
import { get, set } from "idb-keyval";

import {
  OctokitProvider,
  OctokitContext,
} from "./components/octokit-provider.js";

const SUPPORTED_PROJECT_FIELD_TYPES = [
  "TEXT",
  "NUMBER",
  "DATE",
  "SINGLE_SELECT",
  "ITERATION",
];

/**
 *
 * @template T
 * @param {string} key
 * @returns {import('.').Store<T>}
 */
function createStore(key) {
  return {
    async get() {
      return get(key);
    },
    async set(value) {
      return set(key, value);
    },
  };
}

const root = createRoot(
  // @ts-expect-error - we know that #root exists
  document.getElementById("root")
);

const REGEX_VALID_PATH =
  /^\/([a-z0-9-]+)\/([a-z0-9-]+)\/projects\/(\d+)\/issues\/new$/i;

const VERIFICATION_STATE_DEFAULT = {
  accessVerified: false,
  hasRepoAccess: null,
  hasProjectReadAccess: null,
  hasProjectWriteAccess: null,
  error: null,
};

/**
 * @param {import('.').AppState} state
 * @param {import('.').AppStateAction} action
 * @returns {import('.').AppState}
 */
function appStateReducer(state, { action, payload }) {
  console.log("transitioning from %s to %s", state.name, action);

  if (action === "loading") {
    return {
      name: "loading",
      pathIsValid: true,
      loading: true,
      parameters: payload.parameters,
    };
  }

  if (action === "unauthenticated") {
    return {
      name: "unauthenticated",
      pathIsValid: true,
      loading: false,
      isUnauthenticated: true,
      parameters: payload.parameters,
    };
  }

  if (action === "accessError") {
    return {
      name: "accessError",
      pathIsValid: true,
      loading: false,
      parameters: payload.parameters,
      project: payload.project,
      error: "accessError",
      access: payload.access,
    };
  }

  if (action === "requestError") {
    return {
      name: "requestError",
      pathIsValid: true,
      loading: false,
      parameters: payload.parameters,
      error: "requestError",
    };
  }

  if (action === "projectDataLoaded") {
    return {
      name: "projectDataLoaded",
      pathIsValid: true,
      loading: false,
      parameters: payload.parameters,
      isUnauthenticated: false,
      project: payload.project,
    };
  }

  throw new Error(`Unhandled action: ${action}`);
}

/**
 *
 * @param {import(".").Parameters | null} parameters
 * @returns {import(".").AppState}
 */
function initAppState(parameters) {
  if (!parameters) {
    return {
      name: "invalidPath",
      pathIsValid: false,
      loading: false,
    };
  }

  return {
    name: "unauthenticated",
    pathIsValid: true,
    loading: false,
    parameters,
    isUnauthenticated: true,
  };
}

/**
 * @param {object} options
 * @param {import("react").ReactNode} options.children
 * @param {import("@primer/react/lib-esm/sx").BetterSystemStyleObject} [options.sx]
 * @returns
 */
export function ContentWrapper({ children, sx }) {
  return (
    <Box
      sx={{
        p: 4,
        m: "0 auto",
        maxWidth: "1280px",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

function App() {
  const { authState, logout } = React.useContext(OctokitContext);

  const [parameters, setParameters] = React.useState(
    /** @type {null | import('.').Parameters} */
    (null)
  );
  const [isSubmittingIssue, setIsSubmittingIssue] = React.useState(false);
  const [submittedIssueUrl, setSubmittedIssueUrl] = React.useState(null);
  const [verificationState, setVerificationState] = React.useState(
    VERIFICATION_STATE_DEFAULT
  );

  const currentPath = location.pathname;

  if (currentPath === "/") {
    location.pathname = `project-forms/demo/projects/1/issues/new`;
    return;
  }

  /**
   * @type {import(".").Store<import(".").StoreData>}
   */
  const store = createStore(currentPath);

  /**
   * @type {[import(".").AppState, React.Dispatch<import(".").AppStateAction>]}
   */
  const [appState, dispatch] = React.useReducer(appStateReducer, null, () => {
    const matches = currentPath.match(REGEX_VALID_PATH);

    if (!matches) {
      setParameters(null);
      return initAppState(null);
    }

    const [_, owner, repo, projectNumber] = matches;
    const parameters = {
      owner,
      repo,
      projectNumber: parseInt(projectNumber),
    };
    setParameters(parameters);

    return initAppState(parameters);
  });

  // load initial state from store
  React.useEffect(() => {
    if (!parameters) return;

    store.get().then((data) => {
      if (data) {
        dispatch({
          action: "projectDataLoaded",
          payload: {
            parameters,
            project: data,
          },
        });
      }
    });
  }, [parameters]);

  // handle auth state changes
  React.useEffect(() => {
    if (!parameters) return;

    if (authState.type === "unauthenticated") {
      dispatch({ action: "unauthenticated", payload: { parameters } });
      store.set(null);
      return;
    }

    if (authState.type === "loading") {
      dispatch({ action: "loading", payload: { parameters } });
      return;
    }

    if (authState.type === "authenticated") {
      authState.octokit
        .graphql(
          `
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
          `,
          parameters
        )
        .catch((error) => {
          if (!error.response?.data?.data) {
            throw error;
          }

          return error.response.data.data;
        })
        .then((data) => {
          const hasRepoAccess = Boolean(data?.repository);
          const hasProjectReadAccess = Boolean(data?.owner?.project);
          const hasProjectWriteAccess = Boolean(
            data?.owner?.project?.viewerCanUpdate
          );
          const project = data?.owner?.project;

          const hasAccessError = !hasRepoAccess || !hasProjectWriteAccess;
          const access = {
            hasRepoAccess,
            hasProjectReadAccess,
            hasProjectWriteAccess,
          };

          if (hasAccessError) {
            dispatch({
              action: "accessError",
              payload: {
                access,
                parameters,
                project,
              },
            });
            return;
          }

          // Retrieve all project fields and single select options
          return authState.octokit.graphql(
            `
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
            `,
            {
              owner: parameters.owner,
              number: parameters.projectNumber,
            }
          );
        })
        .then((data) => {
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

          dispatch({
            action: "projectDataLoaded",
            payload: {
              parameters,
              project: projectData,
            },
          });

          return store.set(projectData);
        })
        .catch((error) => {
          dispatch({
            action: "requestError",
            payload: {
              parameters,
            },
          });
        });
      return;
    }

    throw new Error(`Unhandled auth state: ${authState.type}`);
  }, [authState, parameters]);

  console.log({ appState });

  if (!appState || appState.loading) {
    return (
      <Box mt="4" display="flex" justifyContent="center">
        <Spinner />
      </Box>
    );
  }

  if (!appState.pathIsValid) {
    return (
      <Box m="4" justifyContent="center">
        <Heading sx={{ mb: 4 }}>Invalid URL</Heading>
        <Text>
          The path does not include a repository owner, repository name, and
          project number.
          <br />
          <br />
          Current path: <code>{currentPath}</code>
          <br />
          Valid example: <code>/project-forms/demo/projects/1/issues/new</code>
        </Text>
      </Box>
    );
  }

  if ("error" in appState) {
    if (appState.error === "requestError") {
      return (
        <Box m="4" justifyContent="center">
          <Heading sx={{ mb: 4 }}>Request Error</Heading>
          <Text>
            Sorry, something went wrong. Please try again later.
            <br />
            <br />
            If the problem persists, please let us know on{" "}
            <Link href="https://github.com/project-forms/project-forms.github.io/issues">
              GitHub
            </Link>
            .
          </Text>
        </Box>
      );
    }

    if (appState.error === "accessError") {
      const { owner, repo, projectNumber } = appState.parameters;

      return (
        <Box m="4" justifyContent="center">
          <Heading sx={{ mb: 4 }}>Access Error</Heading>

          <ActionList>
            <ActionList.Item>
              <ActionList.LeadingVisual>
                {verificationState.hasRepoAccess ? (
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
                {verificationState.hasProjectReadAccess ? (
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
              {appState.project && (
                <Link href={appState.project.url}>
                  #{projectNumber} {appState.project.name}
                </Link>
              )}
            </ActionList.Item>
            <ActionList.Item>
              <ActionList.LeadingVisual>
                {verificationState.hasProjectWriteAccess ? (
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
              {appState.project && (
                <Link href={appState.project.url}>
                  #{projectNumber} {appState.project.name}
                </Link>
              )}
            </ActionList.Item>
          </ActionList>
        </Box>
      );
    }

    // @ts-expect-error
    throw new Error(`Unhandled error: ${appState.error}`);
  }

  if (appState.isUnauthenticated) {
    return (
      <Box
        mt="4"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100vh"
      >
        <Box alignSelf="center" display="grid">
          <StyledOcticon
            icon={TableIcon}
            size={52}
            sx={{ ml: "auto", mr: "auto", mb: 3 }}
          />

          <Text mb="4" textAlign="center">
            You need to sign in in order
            <br />
            to submit an issue.
          </Text>

          <Button
            size="large"
            leadingIcon={MarkGithubIcon}
            as="a"
            href={`/api/github/oauth/login?redirectUrl=${location.href}`}
          >
            Log In With GitHub
          </Button>

          <Text fontSize={0} mt="4" textAlign="center" color="fg.muted">
            Project forms is an indipendent Open
            <br />
            Source project and is not affiliated to GitHub.
          </Text>
        </Box>
      </Box>
    );
  }

  /**
   * @param {import(".").AppStateWithProjectData} appState
   * @param {import("./components/octokit-provider.js").AuthenticatedAuthState} authState
   * @param {React.FormEvent<HTMLFormElement>} event
   */
  async function handleSubmit(appState, authState, event) {
    event.preventDefault();

    setIsSubmittingIssue(true);
    const { title, body, ...projectFields } = Object.fromEntries(
      new FormData(event.target)
    );

    console.log("Creating issue ...");
    // Create the issue
    const { data: issue } = await authState.octokit.request(
      "POST /repos/{owner}/{repo}/issues",
      {
        owner: appState.parameters.owner,
        repo: appState.parameters.repo,
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
      owner: appState.parameters.owner,
      number: appState.parameters.projectNumber,
      fields,
    });

    await project.items.add(issue.node_id, projectFields);

    console.log("Issue added to project: %s", appState.project.url);

    setSubmittedIssueUrl(issue.html_url);
  }

  const { owner, repo, projectNumber } = appState.parameters;

  const projectFields = appState.project.fields.map((field) => {
    if (field.options) {
      const options = field.options.map((option) => {
        return (
          <Select.Option key={option.id} value={option.name}>
            {option.humanName || option.name}
          </Select.Option>
        );
      });

      return (
        <FormControl key={field.id}>
          <FormControl.Label>{field.name}</FormControl.Label>
          <Select name={field.name} children={options} />
        </FormControl>
      );
    }

    return (
      <FormControl key={field.id}>
        <FormControl.Label>{field.name}</FormControl.Label>
        <TextInput name={field.name} type={field.type} />
      </FormControl>
    );
  });

  return (
    <>
      <Header>
        <Header.Item full>
          <Header.Link href="https://github.com/project-forms">
            <StyledOcticon icon={TableIcon} size={32} sx={{ mr: 2 }} />
            <span>Project Forms</span>
          </Header.Link>
        </Header.Item>
        {authState.user?.avatar_url && (
          <Header.Item>
            <ActionMenu>
              <ActionMenu.Anchor>
                <IconButton
                  sx={{ p: 0 }}
                  icon={() => (
                    <Avatar src={authState.user.avatar_url} size={32} />
                  )}
                  variant="invisible"
                />
              </ActionMenu.Anchor>

              <ActionMenu.Overlay>
                <ActionList onClick={logout}>
                  <ActionList.Item>Sign Out</ActionList.Item>
                </ActionList>
              </ActionMenu.Overlay>
            </ActionMenu>
          </Header.Item>
        )}
      </Header>
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
            Submit for to project{" "}
            <Link href={appState.project.url}>
              #{projectNumber} {appState.project.name}
            </Link>
          </Heading>
        </ContentWrapper>
      </Box>

      {submittedIssueUrl === null ? (
        <ContentWrapper>
          <Heading sx={{ mb: 4 }}></Heading>

          <Box sx={{ display: "grid", gridGap: 3 }}>
            <form
              onSubmit={(event) => handleSubmit(appState, authState, event)}
            >
              <FormControl required>
                <FormControl.Label>Issue title</FormControl.Label>
                <TextInput block name="title" />
              </FormControl>

              {projectFields}

              <FormControl>
                <FormControl.Label>Issue description</FormControl.Label>
                <Textarea block name="body"></Textarea>
              </FormControl>
              <Box display="flex" justifyContent="right">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmittingIssue}
                >
                  {isSubmittingIssue && <Spinner size="small" />}
                  Submit new issue
                </Button>
              </Box>
            </form>
          </Box>
        </ContentWrapper>
      ) : (
        <Box
          mt="4"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          height="100vh"
        >
          <Box alignSelf="center">
            <Text textAlign="center">
              Issue submitted:{" "}
              <Link href={submittedIssueUrl}>{submittedIssueUrl}</Link>
            </Text>
          </Box>
        </Box>
      )}
    </>
  );
}

root.render(
  <ThemeProvider>
    <BaseStyles>
      <OctokitProvider store={createStore("octokit-provider")}>
        <App />
      </OctokitProvider>
    </BaseStyles>
  </ThemeProvider>
);
