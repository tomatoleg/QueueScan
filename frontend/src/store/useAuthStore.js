import { create } from "zustand";

export const useAuthStore = create((set) => ({
  token: localStorage.getItem("token") || null,
  username: localStorage.getItem("username") || null,
  isAuthenticated: !!localStorage.getItem("token"),

  login: (token, username) => {
    localStorage.setItem("token", token);
    localStorage.setItem("username", username);

    set({
      token,
      username,
      isAuthenticated: true,
    });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");

    set({
      token: null,
      username: null,
      isAuthenticated: false,
    });
  },
}));

