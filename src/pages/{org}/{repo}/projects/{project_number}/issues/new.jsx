import { Box, Breadcrumbs, Heading, Link } from "@primer/react";

import Nav from "../../../../../../components/Nav.jsx";
import ContentWrapper from "../../../../../../components/ContentWrapper.jsx";
import NewIssueForm from "../../../../../../components/NewIssueForm.jsx";

/**
 * @param {NewIssuePageProps} props
 * @returns
 */
export default function NewIssuePage({
  owner,
  repo,
  projectNumber,
  projectUrl,
  projectName,
  submittedIssueUrl,
  projectFields,
  isSubmittingIssue,
}) {
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
            <Link href={projectUrl}>
              #{projectNumber} {projectName}
            </Link>
          </Heading>
        </ContentWrapper>
      </Box>
      <NewIssueForm
        submittedIssueUrl={submittedIssueUrl}
        projectFields={projectFields}
        isSubmittingIssue={isSubmittingIssue}
      />
    </>
  );
}
