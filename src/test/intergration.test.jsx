import { describe, expect, test } from "vitest";
import { render } from "@testing-library/react";
import { BaseStyles, ThemeProvider } from "@primer/react";

import { OctokitProvider } from "../components/octokit-provider.js";
import App from "../App.jsx";

describe("App", () => {
  test("/project-forms/demo/projects/1/issues/new?code=123", async () => {
    const mockLocation = {
      pathname: "/project-forms/demo/projects/1/issues/new",
      search: "?code=123",
      searchParams: {
        get: (key) => {
          if (key === "code") {
            return "123";
          }
        },
      },
      href: "http://localhost.test/project-forms/demo/projects/1/issues/new?code=123",
    };

    const { getByText } = render(
      <ThemeProvider>
        <BaseStyles>
          <OctokitProvider>
            <App location={mockLocation} />
          </OctokitProvider>
        </BaseStyles>
      </ThemeProvider>
    );

    // TODO: interecept requests
    //       1. exchange token
    //       2. load project

    const title = getByText("Submit to project #1 My Project");

    expect(title).not.toBeNull();
  });
});
