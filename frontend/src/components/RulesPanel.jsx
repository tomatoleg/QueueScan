import { useScannerStore } from "../store/useScannerStore";

export default function RulesPanel() {
  const history = useScannerStore((s) => s.history);

  const filterEnabled = useScannerStore((s) => s.filterEnabled);
  const selectedTalkgroups = useScannerStore((s) => s.selectedTalkgroups);
  const priorities = useScannerStore((s) => s.priorities);

  const setFilterEnabled = useScannerStore((s) => s.setFilterEnabled);
  const setSelectedTalkgroups = useScannerStore((s) => s.setSelectedTalkgroups);
  const setPriority = useScannerStore((s) => s.setPriority);

  const uniqueTalkgroups = [
    ...new Map(
      history.map((h) => [String(h.tgid), h])
    ).values(),
  ];

  const toggleTG = (tgid) => {
    const strId = String(tgid);

    if (selectedTalkgroups.includes(strId)) {
      setSelectedTalkgroups(
        selectedTalkgroups.filter((t) => t !== strId)
      );
    } else {
      setSelectedTalkgroups([
        ...selectedTalkgroups,
        strId,
      ]);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          Rules Engine
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

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {uniqueTalkgroups.map((tg) => {
          const tgid = String(tg.tgid);

          return (
            <div
              key={tgid}
              className="border border-zinc-700 rounded-lg p-3"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">
                    {tg.talkgroup}
                  </div>

                  <div className="text-xs opacity-50">
                    TGID: {tgid}
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={selectedTalkgroups.includes(tgid)}
                  onChange={() => toggleTG(tgid)}
                />
              </div>

              <div className="mt-3">
                <label className="text-sm opacity-70">
                  Priority
                </label>

                <select
                  value={priorities[tgid] ?? 2}
                  onChange={(e) =>
                    setPriority(
                      tgid,
                      Number(e.target.value)
                    )
                  }
                  className="w-full mt-1 bg-zinc-800 border border-zinc-600 rounded p-2"
                >
                  <option value={0}>0 — Ignore</option>
                  <option value={1}>1 — Low</option>
                  <option value={2}>2 — Normal</option>
                  <option value={3}>3 — Important</option>
                  <option value={4}>4 — Interrupt</option>
                  <option value={5}>5 — Always Play</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
