import { describe, expect, test, beforeAll, afterAll, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { BaseStyles, ThemeProvider } from "@primer/react";
import { setupServer } from "msw/node";
import { http, HttpResponse, graphql } from "msw";
import { OctokitProvider } from "../components/octokit-provider.js";
import App from "../App.jsx";
import UserResponse from "./fixtures/api.github.com/user.json";

const server = setupServer();
const githubGraphQL = graphql.link("https://api.github.com/graphql");
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
describe("App", () => {
  beforeAll(() => {
    window.ResizeObserver = ResizeObserver;
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

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

    server.use(
      http.get("https://api.github.com/user", () => {
        return HttpResponse.json(UserResponse);
      }),
      http.post("/api/github/oauth/token", (request, body) => {
        return HttpResponse.json({
          authentication: {
            token: "secret_123",
          },
        });
      }),
      githubGraphQL.query("verifyAccess", () => {
        return HttpResponse.json({
          data: {
            repository: "randomRepo",
            owner: {
              project: {
                viewerCanUpdate: true,
              },
            },
          },
        });
      }),
      githubGraphQL.query("getProjectWithItems", () => {
        return HttpResponse.json({
          data: {
            userOrOrganization: {
              projectV2: {
                title: "My Project",
                url: "Project URL",
                fields: {
                  nodes: [
                    {
                      name: "Field 1",
                      dataType: "text",
                      id: "1",
                    },
                    {
                      name: "Field 2",
                      dataType: "text",
                      id: "2",
                    },
                  ],
                },
              },
            },
          },
        });
      })
    );

    const { asFragment, getByText, debug } = render(
      <ThemeProvider>
        <BaseStyles>
          <OctokitProvider location={mockLocation}>
            <App location={mockLocation} />
          </OctokitProvider>
        </BaseStyles>
      </ThemeProvider>
    );

    // TODO: interecept requests
    //       1. exchange token
    //       2. load project

    await waitFor(
      () => {
        const title = getByText(/My Project/);
        expect(title).not.toBeNull();
      },
      { timeout: 1000 }
    );

    //debug();

    expect(asFragment()).toMatchSnapshot();
  });
});
