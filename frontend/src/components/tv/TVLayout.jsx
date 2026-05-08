// src/components/tv/TVLayout.jsx

import { useEffect } from "react";
import { useScannerStore } from "../../store/useScannerStore";
import SignalScope from "../SignalScope";
import "./tvmode.css";

export default function TVLayout() {
  const currentCall = useScannerStore((s) => s.currentCall);
  const currentAudio = useScannerStore((s) => s.currentAudio);
  const activity = useScannerStore((s) => s.activity);

  useEffect(() => {
    document.documentElement.requestFullscreen().catch(() => {});
  }, []);

  const activeList = Object.values(activity || {})
    .sort((a, b) => (b.count || 0) - (a.count || 0))
    .slice(0, 6);

  return (
    <div className="tv-root">

      {/* PRIMARY */}
      <div className="tv-primary">
        <div className={`tv-primary-inner priority-${currentCall?.priority || 1}`}>
          <div className="tv-title">
            {currentCall?.talkgroup_label || "Idle"}
          </div>

          <div className="tv-sub">
            TG {currentCall?.tgid} • {currentCall?.source || ""}
          </div>

          <SignalScope
            active={!!currentAudio}
            priority={currentCall?.priority || 0}
          />
        </div>
      </div>

      {/* GRID */}
      <div className="tv-grid">
        {activeList.map((tg, i) => (
          <div key={i} className={`tv-tg-card priority-${tg.priority || 1}`}>
            <div className="tv-tg-title">
              {tg.label || `TG ${tg.tgid}`}
            </div>

            <div className="tv-tg-meta">
              Count: {tg.count}
            </div>

            <SignalScope active={true} priority={tg.priority || 1} />
          </div>
        ))}
      </div>

      {/* SIDE */}
      <div className="tv-side">
        <div className="tv-side-title">Activity</div>

        {activeList.map((a, i) => (
          <div key={i} className="tv-activity">
            TG {a.tgid} ({a.count})
          </div>
        ))}
      </div>
    </div>
  );
}
