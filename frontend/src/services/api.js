import { config } from "../config";

export async function apiFetch(path, options = {}) {
  return fetch(`${config.backendUrl}${path}`, options);
}
