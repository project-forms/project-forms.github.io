import { Box, Heading, Link, Text } from "@primer/react";

export default function ErrorFallback({ error /*, resetErrorBoundary */ }) {
  return (
    <Box m="4" justifyContent="center">
      <Heading sx={{ mb: 4 }}>An error occured</Heading>
      <Text>
        {error.message}
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
