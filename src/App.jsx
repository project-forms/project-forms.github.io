// @ts-check
import { redirect } from "react-router-dom";
import { Octokit } from "@octokit-next/core";
import createStore from "./lib/create-store";

const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL || "";

/**
 * @param {string} code
 * @returns Promise<string | null>
 */
async function getTokenFromCode(code, location) {
  const response = await fetch(
    `${backendBaseUrl || location.origin}/api/github/oauth/token`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ code }),
    }
  );
  const responseBody = await response.json();
  const { authentication } = responseBody;
  // TODO - store authentication.refreshToken
  return authentication.token;
}

/**
 * @type {import("react-router-dom").LoaderFunction}
 */
export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  try {
    let gitHubToken = await createStore("token").get();

    if (!gitHubToken && code) {
      gitHubToken = await getTokenFromCode(code, url.pathname);
    }

    if (!gitHubToken) {
      throw new Error("No token");
    }

    const octokit = new Octokit({ auth: gitHubToken });
    const { data: user } = await octokit.request("GET /user");
    const { token } = await octokit.auth();

    await createStore("token").set(token);
    await createStore("user").set(user);

    return redirect("/project-forms/demo/projects/1/issues/new");
  } catch (error) {
    await createStore("token").set(null);
    return redirect("/login");
  }
};

export default function App() {
  return <p>Loading root...</p>;
}
