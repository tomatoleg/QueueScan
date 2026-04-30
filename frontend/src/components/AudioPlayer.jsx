import { useEffect, useRef, useState } from "react";
import { useScannerStore } from "../store/useScannerStore";
import SignalScope from "./SignalScope";
import { useAuthStore } from "../store/useAuthStore";

export default function AudioPlayer() {
  const audioRef = useRef(null);

  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [now, setNow] = useState(Date.now());

  const currentAudio = useScannerStore((s) => s.currentAudio);
  const currentCall = useScannerStore((s) => s.currentCall);
  const talkgroups = useScannerStore( (s) => s.talkgroups);
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

  const urlParams = new URLSearchParams(window.location.search);
  const forceTVMode = urlParams.get("mode") === "tv";
  const tgMeta = currentCall
     ? talkgroups[currentCall.tgid] || {}
     : {};

  const formattedDate = new Date(now).toLocaleDateString(
    undefined,
    {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );

  const formattedTime = new Date(now).toLocaleTimeString(
    undefined,
    {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    }
  );

useEffect(() => {
  if (currentCall) {
    //console.log("CURRENT CALL OBJECT:", currentCall);
  }
}, [currentCall]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!audioUnlocked) return;

    if (audioRef.current && currentAudio) {
      audioRef.current
        .play()
        .catch((err) => {
          console.error("Play failed:", err);
        });
    }
  }, [currentAudio, audioUnlocked]);

  useEffect(() => {
    if (
      audioUnlocked &&
      !currentAudio &&
      replayQueue.length === 0
    ) {
      popLive();
    }
  }, [
    currentAudio,
    replayQueue,
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


  const XhandleEnded = () => {
    if (currentCall?.file) {
      removePlayedCall(currentCall.file);
    }

    if (replayQueue.length > 0) {
      popReplay();
    } else {
      setCurrentAudio(null);
    }
  };


  const handleEnded = () => {
      const finishedFile = currentCall?.file;

      // Clear audio FIRST so popLive can run
      setCurrentAudio(null, null, "live");
    
      if (finishedFile) {
        removePlayedCall(finishedFile);
      }
    
      if (replayQueue.length > 0) {
        setTimeout(() => {
          popReplay();
        }, 100);
        return;
      }
    
      setTimeout(() => {
        popLive();
      }, 100);
    };

  const ZhandleEnded = () => {
    if (currentCall?.file) {
      removePlayedCall(currentCall.file);
    }

    if (replayQueue.length > 0) {
      popReplay();
      return;
    }

    setCurrentAudio(null);
  
    setTimeout(() => {
      popLive();
    }, 150);
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

  const formatCallTime = (timestamp) => {
    if (!timestamp) return "";

    const d = new Date(timestamp);
  
    if (isNaN(d.getTime())) return "";
  
    return d.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const oldestItem = queue[0];

  const queueDelay =
    oldestItem?.queuedAt
      ? now - oldestItem.queuedAt
      : 0;

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-4xl font-bold">
            QueueScan
          </h2>

          <div className="text-sm opacity-60">
            {playbackMode === "replay"
              ? "Replay Playback"
              : "Live Scanner Audio"}
          </div>

          <div className="mt-2 text-sm text-zinc-400">
            {formattedDate}
          </div>

          <div className="text-lg font-mono text-zinc-200">
            {formattedTime}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm text-zinc-400">
              Logged in as
            </div>

            <div className="text-sm font-medium text-zinc-200">
              {username || "Unknown"}
            </div>
          </div>

          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              playbackMode === "replay"
                ? "bg-amber-600"
                : "bg-green-700"
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
            onClick={() => setTvMode(!tvMode)}
            className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-sm"
          >
            {tvMode ? "Exit TV" : "TV Mode"}
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

      {!audioUnlocked && !forceTVMode && (
        <button
          onClick={unlockAudio}
          className="mb-4 px-4 py-2 rounded bg-blue-600 hover:bg-blue-500"
        >
          Enable Audio
        </button>
      )}

      {currentCall ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 min-h-[88px]">
          <div>
            <div className="text-xs uppercase opacity-50 mb-1">
              Talkgroup
            </div>

            <div className="text-4xl font-semibold">
              {tgMeta.label || currentCall.talkgroup}
              {tgMeta.agency && (
              <div className="text-sm text-zinc-400 mt-1">
                {tgMeta.agency}
              </div>
              )}
            </div>
          </div>

          <div>
            <div className="text-xs uppercase opacity-50 mb-1">
              Radio
            </div>

            <div className="text-lg">
              {currentCall.radio || "Unknown"}
            </div>
          </div>

          <div>
            <div className="text-xs uppercase opacity-50 mb-1">
              TGID
            </div>

            <div className="text-lg">
              {currentCall.tgid}
            </div>
        <div className="mt-2 text-sm text-zinc-400">
  {currentCall.time}
</div>


          </div>

        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 min-h-[88px]">
          <div className="flex items-center">
            <div>
              <div className="text-xs uppercase opacity-50 mb-1">
                Talkgroup
              </div>

              <div className="text-4xl font-semibold opacity-40">
                Scanning...
              </div>
            </div>
          </div>

          <div className="flex items-center opacity-30">
            <div>
              <div className="text-xs uppercase opacity-50 mb-1">
                Radio
              </div>

              <div className="text-lg">—</div>
            </div>
          </div>

          <div className="flex items-center opacity-30">
            <div>
              <div className="text-xs uppercase opacity-50 mb-1">
                TGID
              </div>

              <div className="text-lg">—</div>
            </div>
          </div>
        </div>
      )}

      <audio
        key="persistent-player"
        ref={audioRef}
        controls
        className="w-full mb-4"
        src={currentAudio ?? ""}
        onEnded={handleEnded}
      />

      <div className="mb-4">
        <SignalScope active={!!currentAudio} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-zinc-800 rounded-lg p-3">
          <div className="opacity-50 mb-1">
            Queue Depth
          </div>

          <div className="text-xl font-semibold">
            {queue.length}
          </div>
        </div>

        <div className="bg-zinc-800 rounded-lg p-3">
          <div className="opacity-50 mb-1">
            Queue Delay
          </div>

          <div className="text-xl font-semibold">
            {formatAge(queueDelay)}
          </div>
        </div>

        <div className="bg-zinc-800 rounded-lg p-3">
          <div className="opacity-50 mb-1">
            Replay Pending
          </div>

          <div className="text-xl font-semibold">
            {replayQueue.length}
          </div>
        </div>

        <div className="bg-zinc-800 rounded-lg p-3">
          <div className="opacity-50 mb-1">
            Status
          </div>

          <div className="text-xl font-semibold">
            {currentAudio ? "Playing" : "Idle"}
          </div>
        </div>
      </div>
    </div>
  );
}
