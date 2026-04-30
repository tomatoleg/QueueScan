import { useEffect, useRef } from "react";
import { connectWS } from "./services/ws";
import { useScannerStore } from "./store/useScannerStore";

import Layout from "./components/Layout";
import QueuePanel from "./components/QueuePanel";
import ActivityPanel from "./components/ActivityPanel";
import HistoryPanel from "./components/HistoryPanel";
import AudioPlayer from "./components/AudioPlayer";
import Login from "./components/Login";
import { useAuthStore } from "./store/useAuthStore";
import TVLayout from "./components/TVLayout";
import { fetchTalkgroups } from "./services/talkgroups";
import { debug } from "./utils/debug";
import { apiFetch } from "./services/api";


export default function App() {
  debug("App render");

  const isAuthenticated = useAuthStore(
    (s) => s.isAuthenticated
  );

  debug("AUTH STATE:", isAuthenticated);
  debug("TOKEN:", localStorage.getItem("token"));

  const updateData = useScannerStore((s) => s.updateData);
  const tvMode = useScannerStore((s) => s.tvMode);
  const wsRef = useRef(null);

  const urlParams = new URLSearchParams(
     window.location.search
   );

  const setTalkgroups = useScannerStore(
     (s) => s.setTalkgroups
   );


   const forceTVMode = urlParams.get("mode") === "tv";

  useEffect(() => {
    if (!isAuthenticated) return;

    debug("App mounted");

    async function initWS() {
      if (wsRef.current) return;
      const tgData = await fetchTalkgroups();

      setTalkgroups(tgData);

      debug(
        "Talkgroups loaded:",
        Object.keys(tgData).length
      );

      const ws = await connectWS((msg) => {
        //debug("WS MESSAGE:", msg);

        if (msg.type === "full_update") {
          updateData(msg);
        }
      });

      wsRef.current = ws;
    }

    initWS();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [updateData, isAuthenticated]);

  if (!isAuthenticated) {
    return <Login />;
  }

  if (tvMode || forceTVMode) {
    return <TVLayout />;
  }


  return (
    <Layout>
      <div className="space-y-6">
        <AudioPlayer />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <QueuePanel />
          <ActivityPanel />
        </div>

        <HistoryPanel />
      </div>
    </Layout>
  );
}
