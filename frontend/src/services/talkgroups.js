import { config } from "../config";

export async function fetchTalkgroups() {
  const res = await fetch(
    `${config.backendUrl}/api/talkgroups`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch talkgroups");
  }

  return await res.json();
}

