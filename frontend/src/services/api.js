export async function apiFetch(path, opts={}) {
  return fetch(`${config.backendUrl}${path}`, opts);
}
