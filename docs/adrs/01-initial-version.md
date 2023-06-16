# Static Web App with OAuth Service

Date: May 20, 2023

## Context

This is the initial version of Project Forms.

We see an increasing demand to connect GitHub Issue Forms with Projects. What users want is

1. Issue Forms that are in sync with project fields
2. Issues that are auto added to projects and all fields set to the provided values.

Ideally GitHub Projects would provide a “form” primitive which could be selected as issue template once the project is linked to a repository. In order to fill in the gap for the time being, we created a static website that renders forms based on a project number and submits it to a repository as a new issue.

Finally, we were looking for an opportunity to learn more about GitHub’s new projects and [Primer](https://primer.style/).

## Decisions

The initial version was implemented with minimal functionality.

- Participating repositories have to be enabled explicitly by installing the `project-forms`
- Users can only submit forms for repositories that they have access to
- Users and only add the issue to a project and set the fields if they have write access to the project
- The Server for the OAuth web flow was deployed to Netlify as edge function

## Consequences

- The static site is continuously deployed as GitHub Pages from the `project-forms/project-forms.github.io` repository
- The are accessible at `https://project-forms.github.io/{owner}/{repo}/projects/{project_number}/issues/new`
- When opening the website for the first time a user is prompted to sign in with GitHub
- If the repository cannot be found or the user does not have write access to the project, an error message is shown and no form can be submitted
- If the user has all required access, the form is rendered based based on the selected project’s fields.
- The production website at `https://project-forms.github.io` connets to `https://project-forms.netlify.app/` for the OAuth login
- Every pull request has preview deployments on Netlify

## Example

Based on a project with the fields

- Status (single select, options: Done, In Progress, Todo)
- Priority (number)
- Target Date (date)
- Summary (text)

![Screenshoft of demo project with colums: state, priority, target date, and summary](https://github.com/project-forms/project-forms.github.io/assets/39992/3e00eac6-d579-44e4-bab7-1098e5a5f674)

The form would look like this

![Screenshot of form with a dropdown for state, and text inputs for priority, target date, and summary. Below that is a textarea for the issue body](https://github.com/project-forms/project-forms.github.io/assets/39992/4795d7de-af83-4f66-ae1a-63edcbd1350d)

Links

- [Demo Project](https://github.com/orgs/project-forms/projects/1)
- [Figma File for form design](https://www.figma.com/file/eS0xVPdIZY56Q0uhUuMLBS/Design-for-project-forms%2Fproject-forms.github.io%231?type=design&node-id=0%3A1&t=YCOUwqvLElKAqZ6h-1)

## Out of scope

- Issue drafts
- Add fields from issue forms
- Set issue meta data like labels, assignees, and milestone
- Filter what project fields are shown based query parameter
- Editing issues
- Submitting issues to projects without write access
- Submitting issues to repositories without read access
- Displaying past issues submitted with the form
- Build steps and other optimizations
