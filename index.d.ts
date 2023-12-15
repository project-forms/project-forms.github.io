export type AppState =
  | AppStateInvalidPath
  | AppStateWithUnauthenticated
  | AppStateLoading
  | AppStateWithRequestError
  | AppStateWithAccessError
  | AppStateWithProjectData;

export type AppStateDispatcher = (action: AppStateAction) => void;

export type AppStateAction =
  | AppStateActionUnauthenticated
  | AppStateActionLoading
  | AppStateActionRequestError
  | AppStateActionAccessError
  | AppStateActionProjectDataLoaded;

type AppStateData = {
  hasRepoAccess: Boolean;
  hasProjectReadAccess: Boolean;
  hasProjectWriteAccess: Boolean;
  error?: "accessError";
};

export type Parameters = {
  owner: string;
  repo: string;
  projectNumber: number;
};

type AppStateActionUnauthenticated = {
  action: "unauthenticated";
  payload: {
    parameters: Parameters;
  };
};
type AppStateActionLoading = {
  action: "loading";
  payload: {
    parameters: Parameters;
  };
};

type AppStateActionRequestError = {
  action: "requestError";
  payload: {
    parameters: Parameters;
    message: string;
  };
};

type Access = {
  hasRepoAccess: Boolean;
  hasProjectReadAccess: Boolean;
  hasProjectWriteAccess: Boolean;
};

type Project = {
  title: string;
  url: string;
  fields?: ProjectField[];
};

type AppStateActionAccessError = {
  action: "accessError";
  payload: {
    parameters: Parameters;
    access: Access;
    project?: Project;
  };
};

type SupportedProjectFieldTypes =
  | "TEXT"
  | "NUMBER"
  | "DATE"
  | "SINGLE_SELECT"
  | "ITERATION";

type ProjectFieldOption = {
  id: string;
  name: string;
};

type ProjectField = {
  id: string;
  name: string;
  type: SupportedProjectFieldTypes;
  options?: ProjectFieldOption[];
};

type AppStateActionProjectDataLoaded = {
  action: "projectDataLoaded";
  payload: {
    parameters: Parameters;
    project: Project;
  };
};

type AppStateInvalidPath = {
  name: "invalidPath";
  pathIsValid: false;
  loading: false;
};

type AppStateWithUnauthenticated = AppStateValidPath & {
  name: "unauthenticated";
  isUnauthenticated: true;
};

type AppStateValidPath = {
  pathIsValid: true;
  parameters: Parameters;
  loading: false;
};
type AppStateLoading = {
  name: "loading";
  pathIsValid: true;
  parameters: Parameters;
  loading: true;
};

type AppStateWithRequestError = AppStateValidPath & {
  name: "requestError";
  error: "requestError";
  message: string;
};
type AppStateWithAccessError = AppStateValidPath & {
  name: "accessError";
  error: "accessError";
  access: Access;
  project?: Project;
};
type AppStateWithProjectData = AppStateValidPath & {
  name: "projectDataLoaded";
  isUnauthenticated: false;
  parameters: Parameters;
  project: Project;
};

export type StoreData = Project;

export type Store<T> = {
  get: () => Promise<T | null | undefined>;
  set: (data: T | null) => Promise<void>;
};

export type NewIssuePageProps = {
  owner: string;
  repo: string;
  projectNumber: number;
  projectUrl: string;
  projectName: string;
  projectFields?: ProjectField[];
};
