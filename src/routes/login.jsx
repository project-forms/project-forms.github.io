// @ts-check

import { Box, Button, StyledOcticon, Text } from "@primer/react";
import { MarkGithubIcon, TableIcon } from "@primer/octicons-react";

// @ts-expect-error - look into how to define env vars in Vite
const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL || "";

export default function Login() {
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
          href={`${backendBaseUrl}/api/github/oauth/login?redirectUrl=${backendBaseUrl}`}
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
