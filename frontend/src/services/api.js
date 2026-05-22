import { config }
  from "../config";

export async function
apiFetch(
  path,
  options = {}
) {
  const token =
    sessionStorage.getItem(
      "token"
    );

  const headers =
    new Headers(
      options.headers || {}
    );

  // Attach JWT
  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  return fetch(
    `${config.backendUrl}${path}`,
    {
      ...options,
      headers,
    }
  );
}
