import { useEffect, useState } from "react";
import { useScannerStore } from "../store/useScannerStore";

export default function QueuePanel() {
  const queue = useScannerStore((s) => s.queue);
  const currentCall = useScannerStore((s) => s.currentCall);
  const talkgroups = useScannerStore((s) => s.talkgroups);

  const [now, setNow] = useState(Date.now());

  const oldestItem = queue[0];

  const oldestAgeMs = oldestItem?.queuedAt
    ? now - oldestItem.queuedAt
    : 0;

  const oldestAgeSeconds = Math.floor(oldestAgeMs / 1000);

  const criticalCount = queue.filter(
    (q) => (q.priority ?? 2) >= 4
  ).length;

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const groupedQueue = queue.reduce((acc, item) => {
    const key = item.tgid || "unknown";

    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(item);

    return acc;
  }, {});

  const groupedEntries = Object.entries(groupedQueue).sort(
    (a, b) => {
      const aPriority = Math.max(
        ...a[1].map((c) => c.priority || 0)
      );

      const bPriority = Math.max(
        ...b[1].map((c) => c.priority || 0)
      );

      return bPriority - aPriority;
    }
  );

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 5:
        return "bg-red-600";

      case 4:
        return "bg-orange-600";

      case 3:
        return "bg-yellow-600";

      case 2:
        return "bg-zinc-600";

      case 1:
        return "bg-zinc-700";

      default:
        return "bg-zinc-800";
    }
  };

  const getAgeStyle = (seconds) => {
    if (seconds > 60) {
      return "text-red-400";
    }

    if (seconds > 30) {
      return "text-yellow-400";
    }

    return "text-zinc-400";
  };

  const getHealthColor = () => {
    if (oldestAgeSeconds > 90) {
      return "text-red-400";
    }

    if (oldestAgeSeconds > 45) {
      return "text-yellow-400";
    }

    return "text-green-400";
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

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-semibold">
            Queue Timeline
          </h2>

          <div className="text-sm opacity-50">
            {queue.length} pending
          </div>
        </div>

        <div className="text-right space-y-1">
          <div
            className={`text-sm font-medium ${getHealthColor()}`}
          >
            Delay: {formatAge(oldestAgeMs)}
          </div>

          <div className="text-xs opacity-60">
            Critical Waiting: {criticalCount}
          </div>
        </div>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {groupedEntries.map(([tgid, calls]) => {
          const first = calls[0];
          const tgMeta = talkgroups[tgid] || {};

          return (
            <div
              key={tgid}
              className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-sm">
                      {tgMeta.label ||
                        first.talkgroup_name ||
                        first.talkgroup}
                    </div>

                    <div className="text-xs text-zinc-500">
                      TGID {tgid} • {calls.length} calls
                    </div>
                  </div>

                  <div
                    className={`text-xs px-2 py-1 rounded font-medium ${getPriorityColor(
                      Math.max(
                        ...calls.map(
                          (c) => c.priority ?? 2
                        )
                      )
                    )}`}
                  >
                    P
                    {Math.max(
                      ...calls.map(
                        (c) => c.priority ?? 2
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="divide-y divide-zinc-800">
                {calls.map((item, index) => {
                  const ageMs =
                    now - (item.queuedAt || now);

                  const ageSeconds = Math.floor(
                    ageMs / 1000
                  );

                  const isActive =
                    currentCall?.file === item.file;

                  return (
                    <div
                      key={item.file}
                      className={`p-3 transition ${
                        isActive
                          ? "bg-green-500/10 ring-1 ring-green-500"
                          : "bg-zinc-900"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-xs opacity-50">
                              #{index + 1}
                            </div>

                            <div className="text-sm font-medium">
                              {item.radio || "Unknown"}
                            </div>

                            {isActive && (
                              <div className="text-xs px-2 py-0.5 rounded bg-green-600">
                                LIVE
                              </div>
                            )}
                          </div>

                          <div className="text-xs opacity-50 mt-1">
                            {item.time}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <div
                            className={`text-sm font-mono ${getAgeStyle(
                              ageSeconds
                            )}`}
                          >
                            {formatAge(ageMs)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
