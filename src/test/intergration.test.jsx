import {
  describe,
  expect,
  test,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from "vitest";
import { render, waitFor } from "@testing-library/react";
import { BaseStyles, ThemeProvider } from "@primer/react";
import { setupServer } from "msw/node";
import { http, HttpResponse, graphql } from "msw";
import { OctokitProvider } from "../components/octokit-provider.js";
import Root from "../root.jsx";
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
    // It seems like Primer components rely on the existence of `window.ResizeObserver` and it's not (properly) mocked by JS Dom
    // TODO try this instead: vi.stubGlobal("ResizeObserver", ResizeObserver)
    window.ResizeObserver = ResizeObserver;

    // mock local store
    vi.mock("../lib/create-store.js", () => {
      let storeData = {};

      return {
        default: () => ({
          get() {
            return storeData;
          },
          set(data) {
            storeData = data;
          },
        }),
      };
    });

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
      origin: "http://localhost.test",
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

      http.post(
        "http://localhost.test/api/github/oauth/token",
        async ({ request }) => {
          const requestBody = await request.json();
          expect(requestBody).toStrictEqual({
            code: "123",
          });

          return HttpResponse.json({
            authentication: {
              token: "secret_123",
            },
          });
        }
      ),
      githubGraphQL.query("verifyAccess", ({ variables }) => {
        expect(variables).toStrictEqual({
          owner: "project-forms",
          repo: "demo",
          projectNumber: 1,
        });

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
      githubGraphQL.query("getProjectWithItems", ({ variables }) => {
        expect(variables).toStrictEqual({
          owner: "project-forms",
          number: 1,
        });

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

    const { asFragment, getByText } = render(<Root />);

    await waitFor(
      () => {
        const title = getByText(/My Project/);
        expect(title).not.toBeNull();
      },
      { timeout: 1000 }
    );

    expect(asFragment()).toMatchSnapshot();
  });
});
