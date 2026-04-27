import { useEffect, useRef } from "react";
import { connectWS } from "./services/ws";
import { useScannerStore } from "./store/useScannerStore";

import Layout from "./components/Layout";
import NowPlaying from "./components/NowPlaying";
import QueuePanel from "./components/QueuePanel";
import ActivityPanel from "./components/ActivityPanel";
import HistoryPanel from "./components/HistoryPanel";

export default function App() {
  const updateData = useScannerStore((s) => s.updateData);
  const wsRef = useRef(null);

  useEffect(() => {
    if (wsRef.current) return;

    wsRef.current = connectWS((msg) => {
      if (msg.type === "full_update") {
        updateData(msg);
      }
    });

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [updateData]);

  return (
    <Layout>
      <div className="space-y-6">

        {/* Now Playing */}
        <NowPlaying />

        {/* Queue + Activity */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <QueuePanel />
          <ActivityPanel />
        </div>

        {/* History */}
        <HistoryPanel />

      </div>
    </Layout>
  );
}
