// @ts-check

import ReactDOM from "react-dom/client";

import { BaseStyles, ThemeProvider } from "@primer/react";

import Root from "./routes/root.jsx";
import "./index.css";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Login from "./routes/login.jsx";
import NewIssueForm from "./routes/new.jsx";
import App from "./App.jsx";
import { ErrorBoundary } from "react-error-boundary";
import ErrorFallback from "./components/ErrorFallback.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Root />,
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

ReactDOM.createRoot(document.getElementById("root")).render(
  <ThemeProvider>
    <BaseStyles>
      <RouterProvider router={router} />
    </BaseStyles>
  </ThemeProvider>
);
