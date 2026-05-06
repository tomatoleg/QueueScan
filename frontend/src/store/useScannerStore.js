import { create } from "zustand";
import { persist } from "zustand/middleware";
import { config } from "../config";

let seq = 0;

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

      setTalkgroups: (data) => set({ talkgroups: data }),

      selectedTalkgroups: [],
      filterEnabled: false,

      priorities: {},
      tvMode: false,

      setTvMode: (value) => set({ tvMode: value }),

      setFilterEnabled: (enabled) => set({ filterEnabled: enabled }),

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

      // 🔥 Queue system
      priorityQueue: [],
      normalQueue: [],

      setCurrentAudio: (url, call = null, mode = "live") =>
        set({
          currentAudio: url,
          currentCall: call,
          playbackMode: mode,
        }),

      cancelReplay: () =>
        set(() => ({
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
          let next = null;
          let priorityQueue = state.priorityQueue;
          let normalQueue = state.normalQueue;
      
          if (priorityQueue.length > 0) {
            [next, ...priorityQueue] = priorityQueue;
            console.log("PLAYING PRIORITY");
          } else if (normalQueue.length > 0) {
            [next, ...normalQueue] = normalQueue;
            console.log("PLAYING NORMAL");
          }
      
          console.log(
            "PLAY:",
            "SEQ:", next?.seq,
            "URL:", next?.url
          );
      
console.log(
  "POP LIVE DECISION:",
  "priorityQueue:", state.priorityQueue.length,
  "normalQueue:", state.normalQueue.length
);

console.log(
  "PLAY:",
  "SEQ:", next?.seq,
  "URL:", next?.url,
  "TG:", next?.call?.tgid
);
          return {
            priorityQueue,
            normalQueue,
            currentAudio: next?.url || null,
            currentCall: next?.call || null,
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

        if (
          filterEnabled &&
          selectedTalkgroups.length > 0 &&
          !selectedTalkgroups.includes(tgid)
        ) {
          return { allowed: false, priority: 0 };
        }

        const tgMeta = state.talkgroups?.[tgid];

        const priority = Number(
          priorities[tgid] ??
            tgMeta?.priority ??
            call.priority ??
            2
        );

        if (priority <= 0) {
          return { allowed: false, priority };
        }

        return { allowed: true, priority };
      },

      updateData: (payload) =>
        set((state) => {
          const latestCall = payload.metadata;

          let updatedQueue = state.queue;
          let updatedPriorityQueue = state.priorityQueue;
          let updatedNormalQueue = state.normalQueue;

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
                currentAudio: state.currentAudio,
                currentCall: state.currentCall,
                playbackMode: state.playbackMode,
                priorityQueue: state.priorityQueue,
                normalQueue: state.normalQueue,
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

            updatedQueue = updatedQueue
              .filter((item) => {
                const ageOK =
                  item.queuedAt &&
                  Date.now() - item.queuedAt <
                    MAX_QUEUE_AGE;

                return ageOK && !!item.file;
              })
              .slice(-25);

            const token =
              localStorage.getItem("token");

            const liveUrl = `${config.backendUrl}/call/${latestCall.file}?token=${token}`;

            const alreadyQueued =
              state.currentAudio === liveUrl ||
              state.priorityQueue.some(
                (i) => i.url === liveUrl
              ) ||
              state.normalQueue.some(
                (i) => i.url === liveUrl
              );

            if (!alreadyQueued) {
              seq += 1;

              const newItem = {
                url: liveUrl,
                call: latestCall,
                priority: ruleResult.priority,
                seq,
                timestamp: Date.now(),
              };

              const isPriority = ruleResult.priority >= 3;
              if (isPriority) {
                updatedPriorityQueue = [
                  ...state.priorityQueue,
                  newItem,
                ];
              } else {
                updatedNormalQueue = [
                  ...state.normalQueue,
                  newItem,
                ];
              }

              console.log(
                "ENQUEUE:",
                "SEQ:", newItem.seq,
                "TG:", newItem.call.tgid,
                "PRIORITY:", newItem.priority
              );

              console.log(
                "PRIORITY QUEUE:",
                updatedPriorityQueue.map(
                  (c) => c.seq
                )
              );

              console.log(
                "NORMAL QUEUE:",
                updatedNormalQueue.map(
                  (c) => c.seq
                )
              );
            }
          }

          return {
            metadata: payload.metadata,
            history: payload.history,
            activity: payload.activity,
            queue: updatedQueue,

            priorityQueue: updatedPriorityQueue,
            normalQueue: updatedNormalQueue,

            currentAudio: state.currentAudio,
            currentCall: state.currentCall,
            playbackMode: state.playbackMode,
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
