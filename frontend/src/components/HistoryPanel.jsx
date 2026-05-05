import { useScannerStore } from "../store/useScannerStore";
import { config } from "../config";
import { apiFetch } from "../services/api";
import { debug } from "../utils/debug";
import { formatCallTime } from "../utils/time";


export default function HistoryPanel() {

  const history = useScannerStore((s) => s.history);
  const currentCall = useScannerStore((s) => s.currentCall);
  const enqueueReplay = useScannerStore((s) => s.enqueueReplay);
  const popReplay = useScannerStore((s) => s.popReplay);
  const replayTalkgroup = async (tgid) => {
    try {
      const token = localStorage.getItem("token");

      const replayUrl =
        `${config.replayPath}/${tgid}`;

      debug("History Panel Replay URL:", replayUrl);

      const res = await apiFetch(replayUrl);

      if (!res.ok) {
        throw new Error(
          `Replay request failed: ${res.status}`
        );
      }

      const data = await res.json();

      const replayUrls = data.map((call) => ({
        url:
          `${config.backendUrl}/call/${call.file}?token=${token}`,
        call,
      }));

      enqueueReplay(replayUrls);

      setTimeout(() => {
        popReplay();
      }, 50);
    } catch (err) {
      console.error("Replay failed", err);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
      <h2 className="text-xl font-semibold mb-4">
        Call History
      </h2>

      {history.length === 0 ? (
        <div className="opacity-50">
          Waiting for history...
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-700 text-zinc-400 sticky top-0 bg-zinc-900">
              <tr>
                <th className="text-left py-2">Time</th>
                <th className="text-left py-2">Talkgroup</th>
                <th className="text-left py-2">Radio</th>
                <th className="text-left py-2">Freq</th>
                <th className="text-left py-2">Dur</th>
                <th className="text-left py-2">Replay</th>
              </tr>
            </thead>

            <tbody>
              {history.map((row, index) => (
                <tr
                  key={`${row.file}-${index}`}
                  className={`border-b border-zinc-800 hover:bg-zinc-800/50 transition ${
                    currentCall?.file === row.file
                      ? "bg-green-900/30 ring-1 ring-green-500"
                      : ""
                  }`}
                >
                  <td className="py-2">
                    {formatCallTime(row.time)}
                  </td>

                  <td className="py-2">
                    <div className="font-medium">
                      {row.talkgroup}
                    </div>
                  </td>

                  <td className="py-2">
                    {row.radio}
                  </td>

                  <td className="py-2">
                    {row.frequency || "-"}
                  </td>

                  <td className="py-2">
                    {row.duration
                      ? `${row.duration.toFixed(1)}s`
                      : "-"}
                  </td>

                  <td className="py-2">
                    <button
                      onClick={() =>
                        replayTalkgroup(row.tgid)
                      }
                      className="px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 transition"
                    >
                      ▶
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
