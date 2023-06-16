import "@octokit-next/types-rest-api";
import { Octokit } from "@octokit-next/core";

export type User = Octokit.Endpoints["GET /user"]["response"]["data"];

export type AuthState =
  | UnauthenticatedAuthState
  | AuthenticatedAuthState
  | LoadingAuthState;

export type UnauthenticatedAuthState = {
  type: "unauthenticated";
  octokit: Octokit;
};
export type AuthenticatedAuthState = {
  type: "authenticated";
  user: User;
  octokit: Octokit;
};
export type LoadingAuthState = {
  type: "loading";
  octokit: Octokit;
};

export type Store = {
  get: () => StoreData | null | Promise<StoreData | null>;
  set: (data: StoreData | null) => void | Promise<void>;
};

export type StoreData = {
  token: string;
  user: User;
};

export type OctokitContextValue = {
  authState: AuthState;
  logout: () => Promise<void>;
};
export const OctokitContext: React.Context<OctokitContextValue>;

export const OctokitProvider: React.Provider;
