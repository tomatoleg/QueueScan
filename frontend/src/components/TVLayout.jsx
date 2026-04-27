import AudioPlayer from "./AudioPlayer";
import QueuePanel from "./QueuePanel";
export default function TVLayout() {
  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="w-full max-w-[1800px] h-screen p-8 flex flex-col gap-8">

        <div className="h-[60%]">
          <AudioPlayer />
        </div>

        <div className="h-[40%] overflow-hidden">
          <QueuePanel />
        </div>

      </div>
    </div>
  );
}
