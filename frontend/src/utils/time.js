export const formatCallTime = (timestamp) => {
  if (!timestamp) return "";

  const d = new Date(timestamp);

  if (isNaN(d.getTime())) return "";

  return d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
};
