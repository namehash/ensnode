import React, { useEffect, useRef } from "react";

export default function VideoAsciiAnimation() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const prerenderCanvasRef = useRef<HTMLCanvasElement>(null);
    const outputCanvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const video = videoRef.current;
        const prerender = prerenderCanvasRef.current;
        const outputCanvas = outputCanvasRef.current;
        if (!video || !prerender || !outputCanvas) return;

        const preCtx = prerender.getContext("2d", { willReadFrequently: true });
        const outCtx = outputCanvas.getContext("2d");
        if (!preCtx || !outCtx) return;

        const ratio = window.devicePixelRatio || 1;
        const computedStyle = getComputedStyle(outputCanvas);
        const cssWidth = parseInt(computedStyle.getPropertyValue("width"), 10);
        const cssHeight = parseInt(computedStyle.getPropertyValue("height"), 10);

        // Adjust the canvas' backing store size:
        outputCanvas.width = cssWidth * ratio;
        outputCanvas.height = cssHeight * ratio;

        // Scale the context so drawing operations use the proper pixel ratio
        outCtx.scale(ratio, ratio);

        // Instead of fixed char scale factors, compute them to fill the entire canvas.
        // The prerender canvas resolution is used to decide how many "cells" the ASCII art will have.
        const prerenderWidth = prerender.width;
        const prerenderHeight = prerender.height;
        const charW = cssWidth / prerenderWidth;
        const charH = cssHeight / prerenderHeight;

        // Set the font size to match the computed cell height
        outCtx.font = `${charH}px monospace`;
        outCtx.textBaseline = "top";

        // 🎨 ENS Letters Character Set (lowercase a-z) plus ".eth"
        const charsFixed: string[] = [
            "a",
            "b",
            "c",
            "d",
            "e",
            "f",
            "g",
            "h",
            "i",
            "j",
            "k",
            "l",
            "m",
            "n",
            "o",
            "p",
            "q",
            "r",
            "s",
            "t",
            "u",
            "v",
            "w",
            "x",
            "y",
            "z",
        ];

        let chars: (string | string[])[] = [...charsFixed];
        const charsLength = chars.length;
        const MAX_COLOR_INDEX = 255;

        let animationFrameId: number;
        const FRAME_INTERVAL = 1000 / 30;
        let lastDrawTime = 0;

        function updateCanvas(timestamp: number) {
            if (timestamp - lastDrawTime < FRAME_INTERVAL) {
                animationFrameId = requestAnimationFrame(updateCanvas);
                return;
            }

            const w = prerender!.width;
            const h = prerender!.height;
            if (!w || !h || video!.paused) {
                animationFrameId = requestAnimationFrame(updateCanvas);
                return;
            }

            preCtx!.drawImage(video!, 0, 0, w, h);
            const data = preCtx!.getImageData(0, 0, w, h).data;

            // Clear the output canvas
            outCtx!.clearRect(0, 0, outputCanvas!.width, outputCanvas!.height);

            // Draw the ASCII art to the output canvas, scaling each "cell" to fully cover the canvas
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const index = (x + y * w) * 4;
                    const r = data[index];
                    const g = data[index + 1];
                    const b = data[index + 2];
                    const brightness = (r + g + b) / 3;
                    const charIndex = Math.floor(
                        (charsLength * brightness) / MAX_COLOR_INDEX,
                    );
                    const result = chars[charIndex];
                    const char = Array.isArray(result)
                        ? result[Math.floor(Math.random() * result.length)]
                        : result;
                    if (!char) continue;

                    outCtx!.fillStyle = `rgb(${r}, ${g}, ${b})`;
                    outCtx!.fillText(char, x * charW, y * charH);
                }
            }

            lastDrawTime = timestamp;
            animationFrameId = requestAnimationFrame(updateCanvas);
        }

        video.play().then(() => {
            animationFrameId = requestAnimationFrame(updateCanvas);
        });

        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    return (
        <div className="relative w-full h-full animate-fadeIn">
            {/* Output canvas for displaying ASCII art */}
            <canvas
                ref={outputCanvasRef}
                width="1200" // This attribute can be used as a fallback resolution.
                height="640"
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full"
            />

            {/* Hidden video and prerender canvases */}
            <video
                ref={videoRef}
                autoPlay
                muted
                loop
                playsInline
                crossOrigin="anonymous"
                className="hidden"
            >
                <source src="/node_bg_video.mp4" type="video/mp4" />
            </video>

            {/* Hidden prerender canvas used for processing the video/image data */}
            <canvas
                ref={prerenderCanvasRef}
                width="240" // The resolution of the ASCII art "cells".
                height="80"
                className="hidden"
            />

            <style>{`
        body {
          margin: 0;
          padding: 0;
          background: white;
          font-family: "Courier New", monospace;
        }
      `}</style>
        </div>
    );
}
