import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../api/services/authService.js";

const AuthContext = createContext(null);
const USER_STORAGE_KEY = "microtask-user";

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistUser(user) {
  if (user) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_STORAGE_KEY);
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  // Seed from localStorage so a returning user sees their app shell instantly;
  // the /me call below always reconciles this against the real session.
  const [user, setUserState] = useState(readStoredUser);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const setUser = useCallback((nextUser) => {
    setUserState((prev) => {
      const mergedUser = nextUser == null ? null : nextUser && typeof nextUser === "object" ? { ...(prev || {}), ...nextUser } : nextUser;
      persistUser(mergedUser);
      return mergedUser;
    });
  }, []);

  // Bootstraps the session from the httpOnly cookies on first load. This is
  // what makes "persistent login" work across page refreshes and new tabs -
  // if the refresh-token cookie is still valid, axiosInstance transparently
  // exchanges it for a new access token and this call succeeds.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await authService.getMe();
        if (!cancelled) setUser(res.data.user);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setUser]);

  // If axiosInstance ever determines the refresh token itself is no longer
  // valid, drop the client-side session so guarded routes redirect to /login.
  useEffect(() => {
    const handleSessionExpired = () => setUser(null);
    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => window.removeEventListener("auth:session-expired", handleSessionExpired);
  }, [setUser]);

  const register = useCallback(
    async (payload) => {
      setAuthError("");
      try {
        const res = await authService.register(payload);
        setUser(res.data.user);
        return res.data.user;
      } catch (err) {
        setAuthError(err.message);
        throw err;
      }
    },
    [setUser]
  );

  const login = useCallback(
    async (payload) => {
      setAuthError("");
      try {
        const res = await authService.login(payload);
        setUser(res.data.user);
        return res.data.user;
      } catch (err) {
        setAuthError(err.message);
        throw err;
      }
    },
    [setUser]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Best-effort: even if the network call fails, clear the local session.
    } finally {
      setUser(null);
      navigate("/login", { replace: true });
    }
  }, [setUser, navigate]);

  // Lets pages (e.g. after OTP email verification) patch fields on the
  // current user - such as isVerified - without a full refetch.
  const updateUser = useCallback((patch) => {
    setUserState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      persistUser(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, authError, register, login, logout, updateUser, setUser }),
    [user, isLoading, authError, register, login, logout, updateUser, setUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
