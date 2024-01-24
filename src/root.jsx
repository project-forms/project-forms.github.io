// @ts-check

import { BaseStyles, ThemeProvider } from "@primer/react";

import RootRoute from "./routes/root.jsx";
import "./index.css";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Login from "./routes/login.jsx";
import NewIssueForm from "./routes/new.jsx";
import App from "./App.jsx";
import { ErrorBoundary } from "react-error-boundary";
import ErrorFallback from "./components/ErrorFallback.jsx";

export default function Root() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <App />,
      children: [
        {
          index: true,
          element: <RootRoute />,
        },
        {
          path: "/login",
          element: <Login />,
        },
        {
          path: "/project-forms/:repo/projects/:project_number/issues/new",
          element: (
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <NewIssueForm />
            </ErrorBoundary>
          ),
          errorElement: <p>Error</p>,
        },
      ],
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
