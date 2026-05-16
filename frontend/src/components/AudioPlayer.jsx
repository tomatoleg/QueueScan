import { useEffect, useRef, useState } from "react";
import { useScannerStore } from "../store/useScannerStore";
import SignalScope from "./SignalScope";
import Oscilloscope from "./Oscilloscope";
import { useAuthStore } from "../store/useAuthStore";
import { formatCallTime } from "../utils/time";
import CodeOverlay from "./CodeOverlay";
import welcomeAudio from "../assets/welcome.mp3";

export default function AudioPlayer() {
  const audioRef = useRef(null);

  const [scannerEnabled, setScannerEnabled] = useState(false);

  const powerOnScanner = async () => {
     try {
       const audio = audioRef.current;

       if (!audio) return;

       // Create a tiny silent audio source
       audio.src =
         "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=";

       // THIS happens during user gesture
       await audio.play();

       audio.pause();
       audio.currentTime = 0;

       setAudioUnlocked(true);
       setScannerEnabled(true);
   
       console.log("Audio unlocked via power button");
       // Play welcome message
       const welcome = new Audio(welcomeAudio);

       await new Promise((resolve) => {
         welcome.onended = resolve;
         welcome.onerror = resolve; // fail gracefully
         welcome.play().catch(resolve);
        // const p = welcome.play();

        // if (p !== undefined) {
        //   p.catch(resolve);
        //   }

       });
       await new Promise((r) => setTimeout(r, 500));

       // Begin scanning

       const hasQueue =
         priorityQueue.length > 0 ||
         normalQueue.length > 0;

       if (hasQueue) {
         popLive();
       }
     } catch (err) {
       console.error("Power on failed", err);
     }
   };



  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [showCodes, setShowCodes] = useState(false);
  const [showOscilloscope, setShowOscilloscope] = useState(() => {
    return localStorage.getItem("showOscilloscope") !== "false";
  });

  const [showSignalScope, setShowSignalScope] = useState(() => {
    return localStorage.getItem("showSignalScope") !== "false";
  });

  const currentAudio = useScannerStore((s) => s.currentAudio);
  const currentCall = useScannerStore((s) => s.currentCall);
  const talkgroups = useScannerStore((s) => s.talkgroups);
  const playbackMode = useScannerStore((s) => s.playbackMode);

  const replayQueue = useScannerStore((s) => s.replayQueue);
  const queue = useScannerStore((s) => s.queue);

  const popReplay = useScannerStore((s) => s.popReplay);
  const popLive = useScannerStore((s) => s.popLive);
  const setCurrentAudio = useScannerStore((s) => s.setCurrentAudio);
  const cancelReplay = useScannerStore((s) => s.cancelReplay);
  const removePlayedCall = useScannerStore((s) => s.removePlayedCall);

  const tvMode = useScannerStore((s) => s.tvMode);
  const setTvMode = useScannerStore((s) => s.setTvMode);

  const logout = useAuthStore((s) => s.logout);
  const username = useAuthStore((s) => s.username);

  const priorityQueue = useScannerStore((s) => s.priorityQueue);
  const normalQueue = useScannerStore((s) => s.normalQueue);

  const urlParams = new URLSearchParams(window.location.search);
  const forceTVMode = urlParams.get("mode") === "tv";

  const tgMeta = currentCall ? talkgroups[currentCall.tgid] || {} : {};

  const formattedDate = new Date(now).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = new Date(now).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });

  useEffect(() => {
    if (currentCall) {
      // console.log("CURRENT CALL OBJECT:", currentCall);
    }
  }, [currentCall]);

  useEffect(() => {
    const handler = (e) => {
      // F1 = radio codes
      if (e.key === "F1") {
        e.preventDefault();

        setShowCodes((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (audioRef.current && currentAudio) {
      audioRef.current
        .play()
        .then(() => {
          if (!audioUnlocked) {
            console.log("Audio unlocked via real playback");
            setAudioUnlocked(true);
          }
        })
        .catch((err) => {
          console.error("Play failed:", err);
        });
    }
  }, [currentAudio]);

  useEffect(() => {
    const hasQueue = priorityQueue.length > 0 || normalQueue.length > 0;

    if (
      scannerEnabled &&
      !currentAudio &&
      replayQueue.length === 0 &&
      hasQueue
    ) {
      popLive();
    }




  }, [
    currentAudio,
    replayQueue,
    priorityQueue,
    normalQueue,
    popLive,
    audioUnlocked,
  ]);

  useEffect(() => {
    const tryUnlock = async () => {
      const audio = audioRef.current;

      if (!audio) return;

      try {
        audio.muted = true;

        const p = audio.play();

        if (p !== undefined) {
          await p;
        }

        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;

        setAudioUnlocked(true);

        console.log("Audio unlocked");
      } catch (err) {
        console.log("Unlock attempt failed", err);
      }
    };

    // TV mode: unlock aggressively on startup
    if (forceTVMode) {
      const timeout = setTimeout(() => {
        tryUnlock();
      }, 500);

      return () => clearTimeout(timeout);
    }

    // Desktop: retry until unlocked
    const timer = setInterval(() => {
      if (!audioUnlocked && audioRef.current) {
        tryUnlock();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [audioUnlocked, forceTVMode]);

  useEffect(() => {
    localStorage.setItem(
      "showOscilloscope",
      showOscilloscope
    );
  }, [showOscilloscope]);
  
  useEffect(() => {
    localStorage.setItem(
      "showSignalScope",
      showSignalScope
    );
  }, [showSignalScope]);

  const handleEnded = () => {
    const finishedFile = currentCall?.file;

    // Remove from history queue
    if (finishedFile) {
      removePlayedCall(finishedFile);
    }

    // If replay is active, continue replay first
    if (replayQueue.length > 0) {
      popReplay();
      return;
    }

    // Clear current audio so queue can advance
    setCurrentAudio(null, null, "live");

    // Immediately pull next call (priority-aware)
    popLive();
  };

  const unlockAudio = async () => {
    try {
      if (audioRef.current) {
        await audioRef.current.play();
        audioRef.current.pause();
      }

      setAudioUnlocked(true);
    } catch (err) {
      console.error("Audio unlock failed", err);
    }
  };

  const formatAge = (ms) => {
    const seconds = Math.floor(ms / 1000);

    if (seconds < 60) {
      return `+${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;

    return `+${minutes}m ${remaining}s`;
  };

  const oldestItem = queue[0];

  const queueDelay = oldestItem?.queuedAt ? now - oldestItem.queuedAt : 0;

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-4xl font-bold">QueueScan</h2>

          <div className="text-sm opacity-60">
            {playbackMode === "replay"
              ? "Replay Playback"
              : "Live Scanner Audio"}
          </div>

          <div className="mt-2 text-sm text-zinc-400">{formattedDate}</div>

          <div className="text-lg font-mono text-zinc-200">{formattedTime}</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm text-zinc-400">Logged in as</div>

            <div className="text-sm font-medium text-zinc-200">
              {username || "Unknown"}
            </div>
          </div>

          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              playbackMode === "replay" ? "bg-amber-600" : "bg-green-700"
            }`}
          >
            {playbackMode.toUpperCase()}
          </div>

          {playbackMode === "replay" && (
            <button
              onClick={cancelReplay}
              className="px-3 py-1 rounded bg-red-700 hover:bg-red-600 text-sm"
            >
              Stop Replay
            </button>
          )}

          <button
            onClick={() =>
              setShowOscilloscope(!showOscilloscope)
            }
            className={`
              px-3 py-2 rounded-lg border transition-colors
              ${
                showOscilloscope
                  ? "bg-cyan-700 border-cyan-600 text-white"
                  : "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300"
              }
            `}
            title="Toggle Oscilloscope"
          >
            Scope
          </button>

          <button
            onClick={() =>
              setShowSignalScope(!showSignalScope)
            }
            className={`
              px-3 py-2 rounded-lg border transition-colors
              ${
                showSignalScope
                  ? "bg-cyan-700 border-cyan-600 text-white"
                  : "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300"
              }
            `}
            title="Toggle Signal Scope"
          >
            Signal
          </button>

          <button
            onClick={() => setShowCodes(true)}
            className="
    px-3 py-2
    rounded-lg
    bg-zinc-800
    hover:bg-zinc-700
    border border-zinc-700
    text-zinc-200
    transition-colors
  "
            title="Radio Codes (F1)"
          >
            Codes
          </button>
          <button
            onClick={() => {
              logout();
              window.location.reload();
            }}
            className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {!scannerEnabled && (
         <button
           onClick={powerOnScanner}
           className="
             mb-4 w-full py-6 rounded-xl
             bg-green-700 hover:bg-green-600
             text-2xl font-bold tracking-widest
             border border-green-500
           "
         >
           POWER ON SCANNER
         </button>
       )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5 h-[120px] overflow-hidden">
        {/* Talkgroup */}
        <div>
          <div className="text-xs uppercase opacity-50 mb-1">Talkgroup</div>

          <div className="h-[96px] flex flex-col justify-start overflow-hidden">
            <div
              className={`text-4xl font-semibold leading-tight break-words ${
                !currentCall ? "opacity-40" : ""
              }`}
              style={{
                minHeight: "4.8rem",
                maxHeight: "4.8rem",
              }}
            >
              {currentCall ? (
                tgMeta.label || currentCall.talkgroup
              ) : (
                <div className="flex items-center gap-4 h-full">
                  {/* Radar */}
                  <div className="relative w-16 h-16 shrink-0 opacity-90">
                    {/* Rings */}
                    <div className="absolute inset-0 rounded-full border border-cyan-500/30"></div>
                    <div className="absolute inset-[12px] rounded-full border border-cyan-500/20"></div>
                    <div className="absolute inset-[24px] rounded-full border border-cyan-500/15"></div>

                    {/* Crosshair */}
                    <div className="absolute left-1/2 top-0 h-full w-px bg-cyan-500/15 -translate-x-1/2"></div>
                    <div className="absolute top-1/2 left-0 w-full h-px bg-cyan-500/15 -translate-y-1/2"></div>

                    {/* Sweep */}
                    <div
                      className="absolute left-1/2 top-1/2 h-8 w-[2px] origin-bottom animate-spin"
                      style={{
                        animationDuration: "2.5s",
                        background:
                          "linear-gradient(to top, rgba(34,211,238,0.95), rgba(34,211,238,0))",
                        transform: "translateX(-50%)",
                        transformOrigin: "bottom center",
                      }}
                    ></div>

                    {/* Center Dot */}
                    <div className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full bg-cyan-400 -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
                  </div>

                  {/* Text */}
                  <div className="flex flex-col leading-none">
                    <span className="text-cyan-400 text-3xl font-semibold tracking-[0.2em] animate-pulse">
                      SCANNING
                    </span>

                    <span className="text-zinc-500 text-sm tracking-[0.25em] uppercase">
                      Monitoring channels
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Call Time */}
        <div>
          <div className="text-xs uppercase opacity-50 mb-1">Call Time</div>
          <div className={`text-lg ${!currentCall ? "opacity-30" : ""}`}>
            {currentCall ? formatCallTime(currentCall.time) : ""}
          </div>
        </div>

        {/* Radio */}
        <div>
          <div className="text-xs uppercase opacity-50 mb-1">Radio</div>

          <div className={`text-lg ${!currentCall ? "opacity-30" : ""}`}>
            {currentCall?.radio || "—"}
          </div>
        </div>

        {/* Frequency */}
        <div>
          <div className="text-xs uppercase opacity-50 mb-1">Frequency</div>

          <div className={`text-lg ${!currentCall ? "opacity-30" : ""}`}>
            {currentCall?.frequency || "—"}
          </div>
        </div>

        {/* TGID */}
        <div>
          <div className="text-xs uppercase opacity-50 mb-1">TGID</div>

          <div className={`text-lg ${!currentCall ? "opacity-30" : ""}`}>
            {currentCall?.tgid || "—"}
          </div>

        </div>
      </div>

      <audio
        key="persistent-player"
        ref={audioRef}
        controls
        className="w-full mb-4"
        src={currentAudio ?? ""}
        onEnded={handleEnded}
      />

      <div className="space-y-4 mb-4">
        {showOscilloscope ? (
          <Oscilloscope
            audioElement={audioRef.current}
            priority={currentCall?.priority || 0}
          />
        ) : null}
      
        {showSignalScope ? (
          <SignalScope
            active={!!currentAudio}
            priority={currentCall?.priority || 0}
          />
        ) : null}
      </div>



      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-zinc-800 rounded-lg p-3">
          <div className="opacity-50 mb-1">Queue Depth</div>

          <div className="text-xl font-semibold">{queue.length}</div>
        </div>

        <div className="bg-zinc-800 rounded-lg p-3">
          <div className="opacity-50 mb-1">Queue Delay</div>

          <div className="text-xl font-semibold">{formatAge(queueDelay)}</div>
        </div>

        <div className="bg-zinc-800 rounded-lg p-3">
          <div className="opacity-50 mb-1">Replay Pending</div>

          <div className="text-xl font-semibold">{replayQueue.length}</div>
        </div>

        <div className="bg-zinc-800 rounded-lg p-3">
          <div className="opacity-50 mb-1">Status</div>

          <div className="text-xl font-semibold">
            {currentAudio ? "Playing" : "Idle"}
          </div>
          <CodeOverlay open={showCodes} onClose={() => setShowCodes(false)} />
        </div>
      </div>
    </div>
  );
}
