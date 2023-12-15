import ReactDOM from "react-dom/client";

import { BaseStyles, ThemeProvider } from "@primer/react";

import { OctokitProvider } from "./components/octokit-provider.js";
import createStore from "./lib/create-store.js";
import App from "./App.jsx";
import "./index.css";

// @ts-expect-error
ReactDOM.createRoot(document.getElementById("root")).render(
  <ThemeProvider>
    <BaseStyles>
      <OctokitProvider store={createStore("octokit-provider")}>
        <App />
      </OctokitProvider>
    </BaseStyles>
  </ThemeProvider>
);
