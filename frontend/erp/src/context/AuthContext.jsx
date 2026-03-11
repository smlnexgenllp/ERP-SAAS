import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Hardcoded for local development only
// Change this to your production URL when deploying
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");

  // Debug: show what URL we're using
  console.log("[Auth] Using backend URL:", API_BASE_URL);

  useEffect(() => {
    const init = async () => {
      await getCsrfToken();
      await checkAuthStatus();
      setLoading(false);
    };

    init();
  }, []);

  const getCsrfToken = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/auth/csrf-token/`,
      { method: "GET", credentials: "include" }
    );

    console.log("[CSRF] Status:", response.status);

    if (response.ok) {
      const data = await response.json();
      setCsrfToken(data.csrfToken);
      console.log("[CSRF] Token set:", data.csrfToken);
    } else {
      console.warn("[CSRF] Endpoint failed with status:", response.status);
      // Fallback to cookie
      const cookieToken = getCsrfTokenFromCookie();
      if (cookieToken) {
        setCsrfToken(cookieToken);
        console.log("[CSRF] Fallback from cookie:", cookieToken);
      }
    }
  } catch (error) {
    console.error("[CSRF] Fetch error:", error);
    // Fallback even on network error
    const cookieToken = getCsrfTokenFromCookie();
    if (cookieToken) setCsrfToken(cookieToken);
  }
};

  const getCsrfTokenFromCookie = () => {
    const name = "csrftoken";
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === name + "=") {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  };

  const checkAuthStatus = async () => {
    try {
      const token = getCsrfTokenFromCookie();

      const response = await fetch(
        `${API_BASE_URL}/api/auth/current-user/`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token && { "X-CSRFToken": token }),
          },
          credentials: "include",
        }
      );

      console.log("Auth status check response:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Auth status data:", data);
        if (data.success) {
          setUser(data.user);
          setOrganization(data.organization);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    }
  };

  const login = async (credentials) => {
    try {
      console.log("Attempting login with:", credentials);

      const token = getCsrfTokenFromCookie();

      const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { "X-CSRFToken": token }),
        },
        body: JSON.stringify(credentials),
        credentials: "include",
      });

      console.log("Login response status:", response.status);

      const data = await response.json();
      console.log("Login response data:", data);

      if (data.success) {
        setUser(data.user);
        setOrganization(data.organization);
        setIsAuthenticated(true);
        return {
          success: true,
          user: data.user,
          organization: data.organization,
        };
      } else {
        return {
          success: false,
          error: data.error || "Login failed",
        };
      }
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: "Network error. Please try again.",
      };
    }
  };

  const logout = async () => {
    try {
      const token = getCsrfTokenFromCookie();

      await fetch(`${API_BASE_URL}/api/auth/logout/`, {
        method: "POST",
        headers: {
          ...(token && { "X-CSRFToken": token }),
        },
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setOrganization(null);
      setIsAuthenticated(false);
    }
  };

  const employeeLogout = async () => {
  try {
    await api.post("/auth/employee-logout/");
  } catch (err) {
    console.warn("Employee logout failed, proceeding client-side", err);
  }

  document.cookie = "sessionid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

  setUser(null);
  setOrganization(null);
  setIsAuthenticated(false);

  window.location.href = "/employee_login";
};

  const value = {
    user,
    organization,
    isAuthenticated,
    loading,
    csrfToken,
    login,
    logout,
    checkAuthStatus,
    getCsrfToken,
    employeeLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};