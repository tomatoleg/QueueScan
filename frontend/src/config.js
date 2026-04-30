//const protocol = window.location.protocol;
//const hostname = window.location.hostname;

export const config = {
  backendUrl:
    import.meta.env.VITE_BACKEND_URL || "/api",

  websocketPath: "/ws",
  apiPath: "",
  replayPath: "/replay",

  defaultQueueLimit: 25,
  historyLimit: 250,

  audio: {
    autoplay: true,
    defaultVolume: 1.0,
  },

  ui: {
    refreshThrottleMs: 100,
    activityMaxRows: 100,
  },
};
