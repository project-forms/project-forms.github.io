// @ts-check

import { useContext } from "react";
import { Box, Button, Spinner, StyledOcticon, Text } from "@primer/react";
import { MarkGithubIcon, TableIcon } from "@primer/octicons-react";
import { ErrorBoundary } from "react-error-boundary";

import { OctokitContext } from "./components/octokit-provider.js";
import ErrorFallback from "./components/ErrorFallback.jsx";
import NewIssuePage from "./pages/{org}/{repo}/projects/{project_number}/issues/new.jsx";

// @ts-expect-error - look into how to define env vars in Vite
const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL || "";

export default function App() {
  const { authState } = useContext(OctokitContext);

  const currentPath = location.pathname;

  if (currentPath === "/") {
    location.pathname = `project-forms/demo/projects/1/issues/new`;
    return;
  }

  if (authState.type === "loading") {
    return (
      <Box mt="4" display="flex" justifyContent="center">
        <Spinner />
      </Box>
    );
  }

  if (authState.type === "unauthenticated") {
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
            href={`${backendBaseUrl}/api/github/oauth/login?redirectUrl=${location.href}`}
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

  if (authState.type !== "authenticated") {
    // @ts-expect-error
    throw new Error(`Unhandled authState.type: ${authState.type}`);
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <NewIssuePage />
    </ErrorBoundary>
  );
}
