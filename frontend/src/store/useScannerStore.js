import { create } from "zustand";
import { persist } from "zustand/middleware";
import { config } from "../config";

export const useScannerStore = create(
  persist(
    (set) => ({
  metadata: null,
  history: [],
  activity: {},
  queue: [],
  playbackMode: "live",
  currentCall: null,

  talkgroups: {},

  setTalkgroups: (data) =>
    set({ talkgroups: data }),

  selectedTalkgroups: [],
  filterEnabled: false,

  priorities: {},
  tvMode: false,

  
  setTvMode: (value) =>
    set({ tvMode: value }),

  setFilterEnabled: (enabled) =>
    set({ filterEnabled: enabled }),

  setSelectedTalkgroups: (list) =>
    set({ selectedTalkgroups: list }),

  setPriority: (tgid, priority) =>
    set((state) => ({
      priorities: {
        ...state.priorities,
        [tgid]: priority,
      },
    })),
  replayQueue: [],
  currentAudio: null,
  liveQueue: [],

  setCurrentAudio: (url, call = null, mode = "live") =>
  set({
    currentAudio: url,
    currentCall: call,
    playbackMode: mode,
  }),

  cancelReplay: () =>
  set((state) => ({
    replayQueue: [],
    currentAudio: null,
    playbackMode: "live",
  })),

  enqueueReplay: (calls) =>
    set({
      replayQueue: calls,
    }),
  popReplay: () =>
  set((state) => {
    const [next, ...remaining] = state.replayQueue;

    return {
      replayQueue: remaining,
      currentAudio: next?.url || null,
      currentCall: next?.call || null,
      playbackMode: "replay",
    };
  }),

  popLive: () =>
  set((state) => {
    if (state.currentAudio) return {};

    const [next, ...remaining] = state.liveQueue;

    if (!next || !next.url) {
      return {
        liveQueue: remaining,
        currentAudio: null,
      };
    }

    return {
      liveQueue: remaining,
      currentAudio: next.url,
      currentCall: next.call,
      playbackMode: "live",
    };
  }),
 
removePlayedCall: (file) =>
  set((state) => ({
    queue: state.queue.filter(
      (item) => item.file !== file
    ),
  })),


shouldProcessCall: (call) => {
  const state = useScannerStore.getState();

  const {
    filterEnabled,
    selectedTalkgroups,
    priorities,
  } = state;

  const tgid = String(call.tgid);

  // Filtering
  if (
    filterEnabled &&
    selectedTalkgroups.length > 0 &&
    !selectedTalkgroups.includes(tgid)
  ) {
    return {
      allowed: false,
      priority: 0,
    };
  }


  const tgMeta = state.talkgroups?.[tgid];

  const priority = Number(
     priorities[tgid] ??
     tgMeta?.priority ??
     call.priority ??
     2
   );

  console.log(
  "TG",
  tgid,
  "Priority:",
  priority,
  "TG Meta:",
  tgMeta
);


  if (priority <= 0) {
    return {
      allowed: false,
      priority,
    };
  }

  return {
    allowed: true,
    priority,
  };
},

updateData: (payload) =>
  set((state) => {
    const latestCall = payload.metadata;

    let updatedQueue = state.queue;
    let updatedLiveQueue = state.liveQueue;

    if (latestCall && latestCall.file) {
       const { shouldProcessCall } =
         useScannerStore.getState();

       const ruleResult =
         shouldProcessCall(latestCall);

       if (!ruleResult.allowed) {
         return {
           metadata: payload.metadata,
           history: payload.history,
           activity: payload.activity,
           queue: state.queue,
           liveQueue: state.liveQueue,
           currentAudio: state.currentAudio,
           currentCall: state.currentCall,
           playbackMode: state.playbackMode,
         };
       }


      const enrichedCall = {
        ...latestCall,
        priority: ruleResult.priority,
        queuedAt: Date.now(),
      };


      updatedQueue = [
        ...state.queue.filter(
          (q) => q.file !== latestCall.file
        ),
        enrichedCall,
      ];

      const MAX_QUEUE_AGE = 30 * 60 * 1000;

      updatedQueue = updatedQueue.filter((item) => {
        const ageOK =
          item.queuedAt &&
          Date.now() - item.queuedAt < MAX_QUEUE_AGE;
      
        const hasFile = !!item.file;

        return ageOK && hasFile;
      }).slice(-25);

      const token = localStorage.getItem("token");

      const liveUrl = `${config.backendUrl}/call/${latestCall.file}?token=${token}`;
      //console.log("LIVE AUDIO URL:", liveUrl);
      //console.log("LIVE CALL:", latestCall);
      const alreadyQueued =
        state.liveQueue.some(
          (item) => item.url === liveUrl
        ) ||
        state.currentAudio === liveUrl;

      if (!alreadyQueued) {

        updatedLiveQueue = [
            ...state.liveQueue,
            {
              url: liveUrl,
              call: latestCall,
              priority: ruleResult.priority,
              timestamp: Date.now(),
            },
          ].sort((a, b) => {
            if (b.priority !== a.priority) {
              return b.priority - a.priority;
            }

            return a.timestamp - b.timestamp;
          });
      }

    }

    const shouldStartLive =
      !state.currentAudio &&
      updatedLiveQueue.length > 0;

    return {
      metadata: payload.metadata,
      history: payload.history,
      activity: payload.activity,
      queue: updatedQueue,

      liveQueue: shouldStartLive
        ? updatedLiveQueue.slice(1)
        : updatedLiveQueue,

      currentAudio: shouldStartLive
        ? updatedLiveQueue[0].url
        : state.currentAudio,

      currentCall: shouldStartLive
        ? updatedLiveQueue[0].call
        : state.currentCall,

      playbackMode: shouldStartLive
        ? "live"
        : state.playbackMode,

    };
  }),

    }),
    {
      name: "queuescan-store",
      partialize: (state) => ({
        selectedTalkgroups: state.selectedTalkgroups,
        filterEnabled: state.filterEnabled,
        priorities: state.priorities,
      }),
    }
  )
);
