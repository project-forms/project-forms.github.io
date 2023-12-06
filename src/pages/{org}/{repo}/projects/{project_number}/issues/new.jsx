import { Box, Breadcrumbs, Heading, Link } from "@primer/react";
import PropTypes from "prop-types";

import Nav from "../../../../../../components/Nav.jsx";
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
      <NewIssueForm submittedIssueUrl={submittedIssueUrl} />
    </>
  );
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

ContentWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  sx: PropTypes.object,
};
