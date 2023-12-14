import { useCallback, useState, useEffect } from "react";

export default function useAuthState(params) {
  const [authState, setAuthState] = useState({ user: {} });
  // return auth
  const logout = useCallback(() => {
    // TODO: handle logout
  });

  return { authState, logout };
}
