// context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";
import api from "../services/api"; // Your axios instance

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");

  // Get CSRF token on app start
  useEffect(() => {
    const init = async () => {
      // Step 1: Get CSRF token
      await getCsrfToken();

      // Step 2: Check auth status
      await checkAuthStatus();

      setLoading(false);
    };

    init();
  }, []);

  // Get CSRF token using api
  const getCsrfToken = async () => {
    try {
      const response = await api.get("/auth/csrf-token/");
      if (response.data?.csrfToken) {
        setCsrfToken(response.data.csrfToken);
        console.log("CSRF token obtained:", response.data.csrfToken);
      } else {
        console.error("Failed to get CSRF token");
      }
    } catch (error) {
      console.error("Error getting CSRF token:", error);
    }
  };

  // Fallback: Get CSRF from cookie
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

  // Check auth status
  const checkAuthStatus = async () => {
    try {
      const token = csrfToken || getCsrfTokenFromCookie();
      const response = await api.get("/auth/current-user/", {
        headers: {
          ...(token && { "X-CSRFToken": token }),
        },
      });

      console.log("Auth status check response:", response.status);

      if (response.data.success) {
        setUser(response.data.user);
        setOrganization(response.data.organization);
        setIsAuthenticated(true);
        console.log("User authenticated:", response.data.user);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    }
  };

  // Login using api
  const login = async (credentials) => {
    try {
      console.log("Attempting login with:", credentials);

      const token = csrfToken || getCsrfTokenFromCookie();

      const response = await api.post("/auth/login/", credentials, {
        headers: {
          ...(token && { "X-CSRFToken": token }),
        },
      });

      console.log("Login response status:", response.status);
      console.log("Login response data:", response.data);

      if (response.data.success) {
        setUser(response.data.user);
        setOrganization(response.data.organization);
        setIsAuthenticated(true);

        // Force re-check to ensure sync
        await checkAuthStatus();

        return {
          success: true,
          user: response.data.user,
          organization: response.data.organization,
        };
      } else {
        return {
          success: false,
          error: response.data.error || "Login failed",
        };
      }
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Network error. Please try again.",
      };
    }
  };

  // Logout
  const logout = async () => {
    try {
      const token = csrfToken || getCsrfTokenFromCookie();
      await api.post("/auth/logout/", {}, {
        headers: {
          ...(token && { "X-CSRFToken": token }),
        },
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setOrganization(null);
      setIsAuthenticated(false);
    }
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};