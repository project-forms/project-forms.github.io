import { useState, useContext } from "react";
import { Box, Breadcrumbs, Heading, Link } from "@primer/react";
import Project from "github-project";

import { OctokitContext } from "../../../../../../components/octokit-provider.js";
import Nav from "../../../../../../components/Nav.jsx";
import ContentWrapper from "../../../../../../components/ContentWrapper.jsx";
import NewIssueForm from "../../../../../../components/NewIssueForm.jsx";

/**
 * @param {import("../../../../../../..").NewIssuePageProps} props
 * @returns
 */
export default function NewIssuePage({
  owner,
  repo,
  projectNumber,
  projectUrl,
  projectName,
  projectFields,
}) {
  const { authState } = useContext(OctokitContext);
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
  const [submittedIssueUrl, setSubmittedIssueUrl] = useState("");

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
      number: projectNumber,
      fields,
    });

    try {
      // @ts-expect-error
      await project.items.add(issue.node_id, projectFields);
    } catch (error) {
      console.error(error.details);
      throw error;
    }

    console.log("Issue added to project: %s", projectUrl);

    setSubmittedIssueUrl(issue.html_url);
  }

  // TODO: there is a problem with Iteration fields and github-project,
  // so for now we just remove the iteration field
  const projectFieldsWorkaround = projectFields.filter(
    (field) => field.type !== "ITERATION"
  );

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
        onSubmit={onSubmit}
        submittedIssueUrl={submittedIssueUrl}
        projectFields={projectFieldsWorkaround}
        isSubmittingIssue={isSubmittingIssue}
      />
    </>
  );
}
