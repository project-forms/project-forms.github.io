// @ts-check

import { useContext } from "react";
import { Box, Spinner } from "@primer/react";
import { OctokitContext } from "../components/octokit-provider.js";
import { useNavigate } from "react-router-dom";

// TODO: rely on loaders and actions

export default function Root() {
  const { authState } = useContext(OctokitContext);
  const navigate = useNavigate();

  if (authState.type === "loading") {
    return (
      <Box mt="4" display="flex" justifyContent="center">
        <Spinner />
      </Box>
    );
  }

  if (authState.type === "unauthenticated") {
    navigate("/login");
  } else if (authState.type === "authenticated") {
    navigate(`/project-forms/demo/projects/1/issues/new`);
  } else {
    throw new Error(`Unexpected authState.type: ${authState}`);
  }
}
