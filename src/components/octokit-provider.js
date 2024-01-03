// @ts-check

import {
  createContext,
  createElement,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { Octokit } from "@octokit-next/core";

export const OctokitContext = createContext(
  /** @type {import('./octokit-provider').OctokitContextValue | null} */
  (null)
);

// @ts-expect-error - look into how to define env vars in Vite
const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL || "";

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

/**
 * @param {import("./octokit-provider").Store} store
 */
async function loadData(store) {
  return store.get();
}

/**
 * @param {Octokit} octokit
 * @param {React.Dispatch<React.SetStateAction<import('./octokit-provider').AuthState>>} setAuthState
 * @param {import("./octokit-provider").Store} store
 */
async function login(octokit, setAuthState, store) {
  const { data: user } = await octokit.request("GET /user");
  setAuthState({ type: "authenticated", user, octokit });
  const { token } = await octokit.auth();
  await store.set({ user, token });
}

/**
 * @param {Octokit} octokit
 * @param {React.Dispatch<React.SetStateAction<import('./octokit-provider').AuthState>>} setAuthState
 * @param {import("./octokit-provider").Store} store
 */
async function logout(octokit, setAuthState, store) {
  await store.set(null);
  setAuthState({ type: "unauthenticated", octokit });
}

/** @type {import('./octokit-provider').AuthState} */
let INITIAL_AUTH_STATE = {
  type: "loading",
  octokit: new Octokit(),
};

/**
 * @param {React.PropsWithChildren & {store: import("./octokit-provider").Store}} props
 * @returns {ReturnType<React.createElement>}
 */
export const OctokitProvider = ({ children, store = DEFAULT_STORE }) => {
  const [authState, setAuthState] = useState(INITIAL_AUTH_STATE);

  const exportedLogout = useCallback(async () => {
    logout(authState.octokit, setAuthState, store);
  }, [authState, setAuthState, store]);

  // load initial auth state from store
  useEffect(() => {
    console.log("Check for `code` query param");
    const code = new URL(location.href).searchParams.get("code");
    if (code) {
      handleCodeInUrl(store, setAuthState, code);
      return;
    }

    console.log("load initial auth state from store");
    loadData(store).then(async (data) => {
      if (!data) {
        setAuthState({ type: "unauthenticated", octokit: new Octokit() });
        return;
      }

      const octokit = new Octokit({
        auth: data.token,
      });

      setAuthState({ type: "authenticated", user: data.user, octokit });

      try {
        await login(octokit, setAuthState, store);
      } catch {
        await logout(octokit, setAuthState, store);
      }
    });
  }, [setAuthState, store]);

  return createElement(
    OctokitContext.Provider,
    {
      value: {
        authState,
        logout: exportedLogout,
      },
    },
    children
  );
};

/**
 * @param {import('./octokit-provider').Store} store
 * @param {React.Dispatch<React.SetStateAction<import('./octokit-provider').AuthState>>} setAuthState
 * @param {string} code
 */
async function handleCodeInUrl(store, setAuthState, code) {
  // remove ?code=... from URL
  const path =
    location.pathname +
    location.search.replace(/\b(code|state)=\w+/g, "").replace(/[?&]+$/, "");
  history.replaceState({}, "", path);

  setAuthState({ type: "loading", octokit: new Octokit() });
  const token = await getTokenFromCode(code);
  const octokit = new Octokit({ auth: token });

  try {
    await login(octokit, setAuthState, store);
  } catch {
    await logout(octokit, setAuthState, store);
  }
}

/**
 * @param {string} code
 * @returns Promise<string | null>
 */
async function getTokenFromCode(code) {
  try {
    const response = await fetch(`${backendBaseUrl}/api/github/oauth/token`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ code }),
    });
    const { authentication } = await response.json();
    // TODO - store authentication.refreshToken
    return authentication.token;
  } catch (e) {
    return null;
  }
}
