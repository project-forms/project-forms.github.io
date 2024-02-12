import { Outlet } from "react-router-dom";
import createStore from "./lib/create-store.js";
import { OctokitProvider } from "./components/octokit-provider.js";

export default function App() {
  return (
    <OctokitProvider store={createStore("octokit-provider")}>
      <Outlet />
    </OctokitProvider>
  );
}
