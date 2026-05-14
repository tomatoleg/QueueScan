import { useEffect, useRef } from "react";

const audioGraph = {
  context: null,
  analyser: null,
  connectedElements: new WeakMap(),
};

export default function Oscilloscope({
  audioElement,
  priority=0,
}) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const priorityRef = useRef(priority);

  useEffect(() => {
    priorityRef.current = priority;
  }, [priority]);

  useEffect(() => {
    if (
      !audioElement ||
      !canvasRef.current
    ) {
      return;
    }

    let mounted = true;

    const setup = async () => {
      try {
        // Shared AudioContext
        if (
          !audioGraph.context
        ) {
          const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;

          audioGraph.context =
            new AudioContext();
        }

        const audioCtx =
          audioGraph.context;

        // Chromium kiosk mode
        // loves suspending contexts
        if (
          audioCtx.state ===
          "suspended"
        ) {
          try {
            await audioCtx.resume();
          } catch (err) {
            console.warn(
              "Failed to resume AudioContext",
              err
            );
          }
        }

        // Shared analyser
        if (
          !audioGraph.analyser
        ) {
          const analyser =
            audioCtx.createAnalyser();

          analyser.fftSize =
            1024;

          analyser.smoothingTimeConstant =
            0.85;

          audioGraph.analyser =
            analyser;
        }

        const analyser =
          audioGraph.analyser;

        // ONLY create source once
        let source =
          audioGraph.connectedElements.get(
            audioElement
          );

        if (!source) {
          source =
            audioCtx.createMediaElementSource(
              audioElement
            );

          // Visualize only
          source.connect(analyser);
          // Restore audible playback
          analyser.connect(audioCtx.destination);

          audioGraph.connectedElements.set(
            audioElement,
            source
          );
        }

        const canvas =
          canvasRef.current;

        const ctx =
          canvas.getContext("2d");

        const bufferLength =
          analyser.fftSize;

        const dataArray =
          new Uint8Array(
            bufferLength
          );

        const draw = () => {
          if (!mounted)
            return;

          animationRef.current =
            requestAnimationFrame(
              draw
            );

          // Save CPU when idle
          if (
            audioElement.paused ||
            audioElement.ended
          ) {
            ctx.clearRect(
              0,
              0,
              canvas.width,
              canvas.height
            );
            return;
          }

          analyser.getByteTimeDomainData(
            dataArray
          );

          ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
          );

          ctx.beginPath();

          const sliceWidth =
            canvas.width /
            bufferLength;

          let x = 0;

          for (
            let i = 0;
            i <
            bufferLength;
            i++
          ) {
            const v =
              dataArray[i] /
              128.0;

            const y =
              (v *
                canvas.height) /
              2;

            if (i === 0) {
              ctx.moveTo(
                x,
                y
              );
            } else {
              ctx.lineTo(
                x,
                y
              );
            }

            x +=
              sliceWidth;
          }

         let strokeColor = "#3b82f6";

         switch (priorityRef.current) {
           case 5:
             strokeColor = "#ef4444";
             break;
         
           case 4:
             strokeColor = "#f97316";
             break;
         
           case 3:
             strokeColor = "#eab308";
             break;
         
           case 2:
             strokeColor = "#22c55e";
             break;
         
           default:
             strokeColor = "#3b82f6";
             break;
         }
         
         ctx.lineWidth = 2;
         ctx.strokeStyle =
           strokeColor;
         ctx.stroke();

        };

        draw();
      } catch (err) {
        console.error(
          "Oscilloscope error:",
          err
        );
      }
    };

    setup();

    return () => {
      mounted = false;

      if (
        animationRef.current
      ) {
        cancelAnimationFrame(
          animationRef.current
        );
      }
    };
  }, [audioElement,priority]);

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
