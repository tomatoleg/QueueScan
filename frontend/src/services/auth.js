import { config } from "../config";
import { apiFetch } from "../services/api";

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1])
    );

    const now = Math.floor(Date.now() / 1000);

    return payload.exp <= now;
  } catch (err) {
    console.error("Token parse failed", err);
    return true;
  }
}

export async function ensureToken() {
  const token = localStorage.getItem("token");

  if (!token) {
    return null;
  }

  return token;
}

export async function OLDensureToken() {
  let token = localStorage.getItem("token");

  if (token) {
    if (!isTokenExpired(token)) {
      return token;
    }

    debug("Token expired — requesting new token");

    localStorage.removeItem("token");
    token = null;
  }

  try {
    const res = await apiFetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "guest",
        password: "guest",
      }),
    });

    if (!res.ok) {
      throw new Error("Login failed");
    }

    const data = await res.json();

    token = data.access_token;

    localStorage.setItem("token", token);

    debug("New token acquired");

    return token;
  } catch (err) {
    console.error("Token apiFetch failed", err);
    return null;
  }
}
