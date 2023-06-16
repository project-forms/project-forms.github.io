// @ts-check

import {
  checkToken,
  deleteAuthorization,
  deleteToken,
  exchangeWebFlowCode,
  getWebFlowAuthorizationUrl,
  refreshToken,
  resetToken,
  scopeToken,
} from "https://esm.sh/@octokit-next/oauth-methods@2.7.0";

const PATH_PREFIX = "/api/github/oauth";

export const config = {
  path: "/api/github/oauth/*",
};

/**
 * @param {Request} request
 */
export default async (request) => {
  if (
    !Deno.env.get("GITHUB_CLIENT_ID") ||
    !Deno.env.get("GITHUB_CLIENT_SECRET")
  ) {
    return new Response(
      "GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET not configured",
      { status: 500 }
    );
  }

  const response = await handleRequest(
    {
      clientId: String(Deno.env.get("GITHUB_CLIENT_ID")),
      clientSecret: String(Deno.env.get("GITHUB_CLIENT_SECRET")),
    },
    request
  );

  if (!response) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(response.text, {
    status: response.status,
    headers: response.headers,
  });
};

/**
 * Request handler based on https://github.com/octokit/oauth-app.js/blob/91ce0d15a33828eb909004056e2e3ab723bc3ee0/src/middleware/handle-request.ts
 *
 * @param { {clientId: string, clientSecret: string} } options
 * @param {Request} nativeRequest
 *
 * @returns {Promise<null | { status: number, text?: string, headers: Record<string, string>}>}
 */
async function handleRequest({ clientId, clientSecret }, nativeRequest) {
  const request = {
    method: nativeRequest.method,
    url: nativeRequest.url,
    headers: Object.fromEntries(nativeRequest.headers.entries()),
    text: () => nativeRequest.text(),
  };

  if (request.method === "OPTIONS") {
    return {
      status: 200,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "*",
        "access-control-allow-headers":
          "Content-Type, User-Agent, Authorization",
      },
    };
  }

  // request.url may include ?query parameters which we don't want for `route`
  // hence the workaround using new URL()
  const { pathname } = new URL(request.url, "http://localhost");
  const route = [request.method, pathname].join(" ");
  const routes = {
    getLogin: `GET ${PATH_PREFIX}/login`,
    getCallback: `GET ${PATH_PREFIX}/callback`,
    createToken: `POST ${PATH_PREFIX}/token`,
    getToken: `GET ${PATH_PREFIX}/token`,
    patchToken: `PATCH ${PATH_PREFIX}/token`,
    patchRefreshToken: `PATCH ${PATH_PREFIX}/refresh-token`,
    scopeToken: `POST ${PATH_PREFIX}/token/scoped`,
    deleteToken: `DELETE ${PATH_PREFIX}/token`,
    deleteGrant: `DELETE ${PATH_PREFIX}/grant`,
  };

  // handle unknown routes
  if (!Object.values(routes).includes(route)) {
    return null;
  }

  let json;
  try {
    const text = await request.text();
    json = text ? JSON.parse(text) : {};
  } catch {
    return {
      status: 400,
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
      },
      text: JSON.stringify({
        error: "[@octokit/oauth-app] request error",
      }),
    };
  }
  const { searchParams } = new URL(request.url, "http://localhost");
  const query = Object.fromEntries(searchParams);
  const headers = request.headers;

  try {
    if (route === routes.getLogin) {
      const { url } = getWebFlowAuthorizationUrl({
        clientType: "github-app",
        clientId,
        redirectUrl: query.redirectUrl,
      });

      return { status: 302, headers: { location: url } };
    }

    if (route === routes.getCallback) {
      if (query.error) {
        throw new Error(
          `[@octokit/oauth-app] ${query.error} ${query.error_description}`
        );
      }
      if (!query.code) {
        throw new Error('[@octokit/oauth-app] "code" parameter is required');
      }

      const {
        authentication: { token },
      } = await exchangeWebFlowCode({
        clientId,
        clientSecret,
        clientType: "github-app",
        code: query.code,
      });

      return {
        status: 200,
        headers: {
          "content-type": "text/html",
        },
        text: `<h1>Token created successfully</h1>
    
<p>Your token is: <strong>${token}</strong>. Copy it now as it cannot be shown again.</p>`,
      };
    }

    if (route === routes.createToken) {
      const { code, redirectUrl } = json;

      if (!code) {
        throw new Error('[@octokit/oauth-app] "code" parameter is required');
      }

      const result = await exchangeWebFlowCode({
        clientId,
        clientSecret,
        clientType: "github-app",
        code: json.code,
        redirectUrl,
      });

      // @ts-ignore - TS doesn't know type of `result`
      delete result.authentication.clientSecret;

      return {
        status: 201,
        headers: {
          "content-type": "application/json",
          "access-control-allow-origin": "*",
        },
        text: JSON.stringify(result),
      };
    }

    if (route === routes.getToken) {
      const token = headers.authorization?.substring("token ".length);

      if (!token) {
        throw new Error(
          '[@octokit/oauth-app] "Authorization" header is required'
        );
      }

      const result = await checkToken({
        clientId,
        clientSecret,
        clientType: "github-app",
        token,
      });

      delete result.authentication.clientSecret;

      return {
        status: 200,
        headers: {
          "content-type": "application/json",
          "access-control-allow-origin": "*",
        },
        text: JSON.stringify(result),
      };
    }

    if (route === routes.patchToken) {
      const token = headers.authorization?.substring("token ".length);

      if (!token) {
        throw new Error(
          '[@octokit/oauth-app] "Authorization" header is required'
        );
      }

      const result = await resetToken({
        clientId,
        clientSecret,
        clientType: "github-app",
        token,
      });

      delete result.authentication.clientSecret;

      return {
        status: 200,
        headers: {
          "content-type": "application/json",
          "access-control-allow-origin": "*",
        },
        text: JSON.stringify(result),
      };
    }

    if (route === routes.patchRefreshToken) {
      const token = headers.authorization?.substring("token ".length);

      if (!token) {
        throw new Error(
          '[@octokit/oauth-app] "Authorization" header is required'
        );
      }

      if (!json.refreshToken) {
        throw new Error(
          "[@octokit/oauth-app] refreshToken must be sent in request body"
        );
      }

      const result = await refreshToken({
        clientId,
        clientSecret,
        clientType: "github-app",
        refreshToken: json.refreshToken,
      });

      // @ts-expect-error - TS doesn't like the delete?
      delete result.authentication.clientSecret;

      return {
        status: 200,
        headers: {
          "content-type": "application/json",
          "access-control-allow-origin": "*",
        },
        text: JSON.stringify(result),
      };
    }

    if (route === routes.scopeToken) {
      const token = headers.authorization?.substring("token ".length);

      if (!token) {
        throw new Error(
          '[@octokit/oauth-app] "Authorization" header is required'
        );
      }

      const result = await scopeToken({
        clientId,
        clientSecret,
        clientType: "github-app",
        token,
        ...json,
      });

      delete result.authentication.clientSecret;

      return {
        status: 200,
        headers: {
          "content-type": "application/json",
          "access-control-allow-origin": "*",
        },
        text: JSON.stringify(result),
      };
    }

    if (route === routes.deleteToken) {
      const token = headers.authorization?.substring("token ".length);

      if (!token) {
        throw new Error(
          '[@octokit/oauth-app] "Authorization" header is required'
        );
      }

      await deleteToken({
        clientId,
        clientSecret,
        clientType: "github-app",
        token,
      });

      return {
        status: 204,
        headers: { "access-control-allow-origin": "*" },
      };
    }

    // route === routes.deleteGrant
    const token = headers.authorization?.substring("token ".length);

    if (!token) {
      throw new Error(
        '[@octokit/oauth-app] "Authorization" header is required'
      );
    }

    await deleteAuthorization({
      clientId,
      clientSecret,
      clientType: "github-app",
      token,
    });

    return {
      status: 204,
      headers: { "access-control-allow-origin": "*" },
    };
  } catch (error) {
    return {
      status: 400,
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
      },
      text: JSON.stringify({ error: error.message }),
    };
  }
}
