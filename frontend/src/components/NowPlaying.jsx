import { useScannerStore } from "../store/useScannerStore";

export default function NowPlaying() {
  const currentCall = useScannerStore((s) => s.currentCall);
  const playbackMode = useScannerStore((s) => s.playbackMode);

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h2 className="text-xl font-semibold">
            Now Playing
          </h2>

          <div className="text-sm opacity-60">
            Actual Audio Output
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
      </div>

      {currentCall ? (
        <>
          <div className="text-2xl font-bold">
            {currentCall.talkgroup}
          </div>

          <div className="mt-2 opacity-70">
            Radio: {currentCall.radio}
          </div>

          <div className="text-sm opacity-50 mt-1">
            TGID: {currentCall.tgid}
          </div>
        </>
      ) : (
        <div className="opacity-50">
          Waiting for playback...
        </div>
      )}
    </div>
  );
}
