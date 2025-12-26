import React, { createContext, useState, useContext, useEffect } from "react";

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

      // Step 2: Now check auth
      await checkAuthStatus();

      setLoading(false);
    };

    init();
  }, []);

  // Function to get CSRF token
  const getCsrfToken = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/auth/csrf-token/",
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCsrfToken(data.csrfToken);
        console.log("CSRF token obtained:", data.csrfToken);
      } else {
        console.error("Failed to get CSRF token");
      }
    } catch (error) {
      console.error("Error getting CSRF token:", error);
    }
  };

  // Function to get CSRF token from cookies (fallback)
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
      // Get CSRF token from cookie as fallback
      const token = csrfToken || getCsrfTokenFromCookie();

      const response = await fetch(
        "http://localhost:8000/api/auth/current-user/",
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

  // In your login function in AuthContext.jsx
  const login = async (credentials) => {
    try {
      console.log("Attempting login with:", credentials);

      // Get CSRF token from cookie as fallback
      const token = getCsrfTokenFromCookie();

      const response = await fetch("http://localhost:8000/api/auth/login/", {
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

        // Return user role for redirection
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
      // Get CSRF token from cookie as fallback
      const token = getCsrfTokenFromCookie();


      await fetch("http://localhost:8000/api/auth/logout/", {
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