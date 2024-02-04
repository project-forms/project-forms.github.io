// @ts-check

import { BaseStyles, ThemeProvider } from "@primer/react";
import "./index.css";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Login from "./routes/login.jsx";
import NewIssueForm, {
  loader as newIssueProjectLoader,
} from "./routes/new.jsx";
import App, { loader as appLoader } from "./App.jsx";
import { ErrorBoundary } from "react-error-boundary";
import ErrorFallback from "./components/ErrorFallback.jsx";

let storeData = null;
/** @type {import('./octokit-provider').Store} */
let DEFAULT_STORE = {
  get() {
    return storeData;
  },
  set(data) {
    storeData = data;
  },
};

export default function Root({ store = DEFAULT_STORE }) {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <App />,
      loader: appLoader,
    },
    {
      path: "/:owner/:repo/projects/:project_number/issues/new",
      element: (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <NewIssueForm />
        </ErrorBoundary>
      ),
      loader: newIssueProjectLoader,
    },
    {
      path: "/login",
      element: <Login />,
    },
  ]);

  return (
    <ThemeProvider>
      <BaseStyles>
        <RouterProvider router={router} />
      </BaseStyles>
    </ThemeProvider>
  );
}
