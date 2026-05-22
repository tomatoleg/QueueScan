import { create } from "zustand";

export const useAuthStore = create((set) => ({
  token: sessionStorage.getItem("token") || null,
  username: sessionStorage.getItem("username") || null,
  isAuthenticated: !!sessionStorage.getItem("token"),

  login: (token, username) => {
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("username", username);

    set({
      token,
      username,
      isAuthenticated: true,
    });
  },
  clearAuth: () =>
  set({
    token: null,
    username: null,
    isAuthenticated: false,
  }),

  logout: () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("username");

    set({
      token: null,
      username: null,
      isAuthenticated: false,
    });
  },
}));

