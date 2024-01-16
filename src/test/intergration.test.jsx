import { describe, expect, test, beforeAll, afterAll, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { BaseStyles, ThemeProvider } from "@primer/react";
import { setupServer } from "msw/node";
import { OctokitProvider } from "../components/octokit-provider.js";
import App from "../App.jsx";

const server = setupServer();

describe("App", () => {
  beforeAll(() => {
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

    /*
     * ☑️ TODO: use interceptors
     *
     * Requests to be intercepted:
     * 1. GET /user
     * 2. POST /api/github/oauth/token
     * 3. POST /api/github/graphql -> Verify access
     * 4. POST /api/github/graphql -> Get project with items
     *
     * 📚 Interesting Resources:
     * - MSW -> http: https://mswjs.io/docs/api/http
     * - MSW -> graphql.link: https://mswjs.io/docs/api/graphql/#graphqllinkurl
     */
    server.use(/* TODO your interceptors here */);

    const { getByText } = render(
      <ThemeProvider>
        <BaseStyles>
          <OctokitProvider>
            <App location={mockLocation} />
          </OctokitProvider>
        </BaseStyles>
      </ThemeProvider>
    );

    /*
     * 💡 use `waitFor` from testing-library instead:
     * https://testing-library.com/docs/dom-testing-library/api-async/#waitfor
     */
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // TODO: interecept requests
    //       1. exchange token
    //       2. load project
  });
});
