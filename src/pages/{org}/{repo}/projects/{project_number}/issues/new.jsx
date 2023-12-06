import React from "react";
import {
  Box,
  Breadcrumbs,
  Button,
  FormControl,
  Heading,
  Link,
  Spinner,
  Text,
  Textarea,
  TextInput,
} from "@primer/react";
import Nav from "../../../../../components/Nav.js";
import NewIssueForm from "../../../../../../components/NewIssueForm.js";
import useAuthState from "../../../../../../hooks/use-auth-state.js";

export default function NewIssuePage() {
  const { authState } = useAuthState();

  return (
    <>
      <Nav />
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
      <NewIssueForm submittedIssueUrl={submittedIssueUrl} />
    </>
  );
}
