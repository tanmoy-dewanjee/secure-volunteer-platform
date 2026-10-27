"use client";

import { useEffect, useRef, useState } from "react";

type Detector = {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>>;
};

export default function QrScanField({
  onDetect,
  placeholder = "Scan a volunteer QR payload",
}: {
  onDetect: (value: string) => void;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");
  const [scanning, setScanning] = useState(false);
  const [hint, setHint] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const onDetectRef = useRef(onDetect);
  onDetectRef.current = onDetect;

  useEffect(() => {
    if (!scanning) return;
    let stream: MediaStream | undefined;
    let frame = 0;
    let cancelled = false;

    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
    };

    const run = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (!videoRef.current || cancelled) {
          stop();
          return;
        }
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const Detector = (
          window as Window & {
            BarcodeDetector?: new (options: { formats: string[] }) => Detector;
          }
        ).BarcodeDetector;
        if (!Detector) {
          setHint("Camera is on. Paste the volunteer QR text if this browser cannot decode it.");
          return;
        }
        const detector = new Detector({ formats: ["qr_code"] });
        const tick = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const raw = codes[0]?.rawValue;
            if (raw) {
              setValue(raw);
              onDetectRef.current(raw);
              setScanning(false);
              return;
            }
          } catch {
            /* keep scanning */
          }
          frame = requestAnimationFrame(() => void tick());
        };
        void tick();
      } catch {
        setHint("Camera permission was denied. Paste the QR payload instead.");
        setScanning(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
      stop();
    };
  }, [scanning]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          className="min-w-[16rem] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => value.trim() && onDetect(value.trim())}
          className="bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
        >
          Check in
        </button>
        <button
          type="button"
          onClick={() => setScanning((current) => !current)}
          className="border border-black px-4 py-2 text-sm font-semibold"
        >
          {scanning ? "Stop camera" : "Scan camera"}
        </button>
      </div>
      {scanning ? (
        <video
          ref={videoRef}
          className="h-48 w-full max-w-md bg-black object-cover"
          muted
          playsInline
        />
      ) : null}
      {hint ? <p className="text-sm text-gray-500">{hint}</p> : null}
    </div>
  );
}
