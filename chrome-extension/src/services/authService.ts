import apiClient from "@/app/api";


// ✅ Login Function (Token-Based)
export const login = async (email: string, password: string) => {
  try {console.log("Logging in with email: ", email);
    const response = await apiClient.post(
    '/auth/login',
     new URLSearchParams({ email, password }),
    {
      headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    "X-Requested-With": "XMLHttpRequest",
  }
    } 
  );
console.log("Login response: ", response.data);
    if (response.data.success) {
      // Store access token for future authenticated requests
      localStorage.setItem("access-token", response.data.token);
      return response.data;
    }
  } catch (error: Error | any) {
    throw new Error(error.message || "Login failed.");
  }
};

// ✅ Login with Cookies
export const loginWithCookies = async (email: string, password: string) => {
  try {
    const response = await apiClient.post("/authentication/login-with-cookies", { email, password });
 
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Login with cookies failed.");
  }
};

// ✅ Check Authentication Status
export const isAuthenticated = async (): Promise<boolean> => {
  const token = localStorage.getItem("access-token");
  return !!token;
};

// ✅ Logout Function (Token-Based)
export const logout = async () => {
  try {
    await apiClient.post("/auth/logout");
  } catch (error: any) {
    new Error(error.response?.data?.message || "⚠️ Logout failed, but proceeding anyway.");
  }
};

// ✅ Logout & Clear Cookies
export const logoutAndClearCookies = async () => {
  try {
    await apiClient.post("/users/logout");
  } catch (error: any) {
    new Error(error.response?.data?.message || "⚠️ Logout with cookies failed.");
  
  }
};

// ✅ Forgot Password
export async function forgotPassword(email: string): Promise<any> {
  try {
    const response = await apiClient.post("/authentication/forgot-password", { email });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "An error occurred while processing your request.");
  }
}

// ✅ Fetch User Data with Unauthorized Handling
export const getMe = async (): Promise<any> => {
  const token = localStorage.getItem("access-token");
  try {
    const response = await apiClient.get("/users/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      await logoutAndClearCookies();
    }
    throw new Error(error.response?.data?.message || "Failed to fetch user data.");
  }
};
