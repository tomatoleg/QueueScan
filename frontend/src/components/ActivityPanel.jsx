import { useScannerStore } from "../store/useScannerStore";
import { config } from "../config";
import { apiFetch } from "../services/api";

export default function ActivityPanel() {
  const currentCall = useScannerStore((s) => s.currentCall);
  const activity = useScannerStore((s) => s.activity);

  const priorities = useScannerStore((s) => s.priorities);
  const selectedTalkgroups = useScannerStore((s) => s.selectedTalkgroups);
  const filterEnabled = useScannerStore((s) => s.filterEnabled);

  const setPriority = useScannerStore((s) => s.setPriority);
  const setSelectedTalkgroups = useScannerStore((s) => s.setSelectedTalkgroups);
  const setFilterEnabled = useScannerStore((s) => s.setFilterEnabled);

  const enqueueReplay = useScannerStore((s) => s.enqueueReplay);
  const popReplay = useScannerStore((s) => s.popReplay);

  const entries = Object.entries(activity)
    .map(([tg, obj]) => {
      const tgid = String(obj.tgid);

      return {
        key: tg,
        ...obj,
        tgid,
        priority: priorities[tgid] ?? 2,
      };
    })
    .sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }

      return b.count - a.count;
    });

  const toggleTG = (tgid) => {
    if (selectedTalkgroups.includes(tgid)) {
      setSelectedTalkgroups(
        selectedTalkgroups.filter((t) => t !== tgid)
      );
    } else {
      setSelectedTalkgroups([
        ...selectedTalkgroups,
        tgid,
      ]);
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 5:
        return "border-red-500 bg-red-950/20";

      case 4:
        return "border-orange-500 bg-orange-950/20";

      case 3:
        return "border-yellow-500 bg-yellow-950/20";

      case 2:
        return "border-zinc-600 bg-zinc-800";

      case 1:
        return "border-zinc-700 bg-zinc-900 opacity-80";

      default:
        return "border-zinc-800 opacity-50";
    }
  };

  const replayTalkgroup = async (tgid) => {
     try {
       const token = localStorage.getItem("token");
   

       const replayUrl =
         `${config.replayPath}/${tgid}`;
   
       debug("Activity Replay URL:", replayUrl);
   
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          Smart Activity
        </h2>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filterEnabled}
            onChange={(e) =>
              setFilterEnabled(e.target.checked)
            }
          />
          Filter Enabled
        </label>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {entries.map((item) => (
          <div
            key={item.tgid}
            className={`rounded-lg border p-3 transition ${
              getPriorityStyle(item.priority)
            } ${
              currentCall?.tgid == item.tgid
                ? "ring-2 ring-green-400 shadow-lg shadow-green-500/20"
                : ""
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <div className="font-semibold">
                    {item.key}
                  </div>

                  {currentCall?.tgid == item.tgid && (
                    <div className="text-xs px-2 py-0.5 rounded bg-green-600">
                      LIVE
                    </div>
                  )}
                </div>

                <div className="text-xs opacity-50">
                  TGID: {item.tgid}
                </div>

                <div className="text-sm opacity-60 mt-1">
                  {item.count} calls
                </div>
              </div>

              <div className="flex flex-col gap-2 min-w-[110px]">
                <label className="text-xs flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={selectedTalkgroups.includes(item.tgid)}
                    onChange={() => toggleTG(item.tgid)}
                  />
                  Filter
                </label>

                <select
                  value={item.priority}
                  onChange={(e) =>
                    setPriority(
                      item.tgid,
                      Number(e.target.value)
                    )
                  }
                  className="bg-zinc-800 border border-zinc-600 rounded p-1 text-sm"
                >
                 <option value="1">1-Low</option>
                 <option value="2">2-Normal</option>
                 <option value="3">3-Medium</option>
                 <option value="4">4-High</option>
                 <option value="5">5-Critical</option>
                </select>

                <button
                  onClick={() => replayTalkgroup(item.tgid)}
                  className="bg-zinc-700 hover:bg-zinc-600 rounded px-2 py-1 text-sm"
                >
                  ▶ Replay
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
