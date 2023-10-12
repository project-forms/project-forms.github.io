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

type AppStateActionAccessError = {
  action: "accessError";
  payload: {
    parameters: Parameters;
    access: Access;
    project?: {
      title: string;
      url: string;
    };
  };
};

type SupportedProjectFieldTypes =
  | TEXT
  | NUMBER
  | DATE
  | SINGLE_SELECT
  | ITERATION;

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
    project: {
      title: string;
      url: string;
      fields: ProjectField[];
    };
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
  project?: {
    title: string;
    url: string;
  };
};
type AppStateWithProjectData = AppStateValidPath & {
  name: "projectDataLoaded";
  isUnauthenticated: false;
  parameters: Parameters;
  project: {
    title: string;
    url: string;
    fields: any;
  };
};

export type StoreData = {
  hasRepoAccess: Boolean;
  hasProjectReadAccess: Boolean;
  hasProjectWriteAccess: Boolean;
};

export type Store<T> = {
  get: () => Promise<T | null>;
  set: (data: T | null) => Promise<void>;
};
