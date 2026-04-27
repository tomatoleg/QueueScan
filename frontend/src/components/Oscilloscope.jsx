import { useEffect, useRef } from "react";

let audioCtx = null;
let analyser = null;
let sourceNode = null;
let connectedElement = null;

export default function Oscilloscope({ audioElement }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!audioElement || !canvasRef.current) return;

    try {
      if (!audioCtx) {
        const AudioContext =
          window.AudioContext || window.webkitAudioContext;

        audioCtx = new AudioContext();
      }

      if (!analyser) {
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 1024;
      }

      // ONLY create source once per audio element
      if (connectedElement !== audioElement) {
        connectedElement = audioElement;

        if (sourceNode) {
          try {
            sourceNode.disconnect();
          } catch {}
        }

        sourceNode =
          audioCtx.createMediaElementSource(audioElement);

        // IMPORTANT:
        // connect only analyser
        sourceNode.connect(analyser);

        // DO NOT connect destination
        // browser audio element already handles playback
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const draw = () => {
        animationRef.current =
          requestAnimationFrame(draw);

        analyser.getByteTimeDomainData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.beginPath();

        const sliceWidth =
          canvas.width / bufferLength;

        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128;
          const y = (v * canvas.height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 2;
        ctx.stroke();
      };

      draw();
    } catch (err) {
      console.error("Oscilloscope error:", err);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioElement]);

  return (
    <div className="bg-black rounded-lg border border-zinc-800 overflow-hidden">
      <canvas
        ref={canvasRef}
        width={900}
        height={90}
        className="w-full h-[90px]"
      />
    </div>
  );
}
