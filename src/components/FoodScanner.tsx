"use client";

import { BarcodeDetector, type BarcodeFormat } from "barcode-detector/ponyfill";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FoodItem } from "@/app/actions/food";
import { lookupFood } from "@/app/actions/food";

export default function FoodScanner({
  onFood,
  onClose,
}: {
  onFood: (item: FoodItem) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const stoppedRef = useRef(false);

  const stopCamera = useCallback(() => {
    stoppedRef.current = true;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const video = videoRef.current;
    if (video?.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach((t) => {
        t.stop();
      });
      video.srcObject = null;
    }
  }, []);

  const scan = useCallback((): Promise<string | null> => {
    return navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then(async (stream) => {
        const video = videoRef.current;
        if (!video) {
          stream.getTracks().forEach((t) => {
            t.stop();
          });
          return null;
        }
        video.srcObject = stream;
        await new Promise<void>((res) => {
          video.onloadedmetadata = () => res();
        });
        await video.play();

        const supported = await BarcodeDetector.getSupportedFormats();
        const wanted: BarcodeFormat[] = ["ean_13", "ean_8", "upc_a", "upc_e"];
        const formats = wanted.filter((f) => supported.includes(f));
        const detector = new BarcodeDetector(
          formats.length > 0 ? { formats } : undefined,
        );

        return new Promise<string | null>((resolve, reject) => {
          async function tick() {
            if (stoppedRef.current || !video) {
              resolve(null);
              return;
            }
            try {
              const barcodes = await detector.detect(video);
              if (barcodes.length > 0) {
                stopCamera();
                resolve(barcodes[0].rawValue);
              } else {
                animFrameRef.current = requestAnimationFrame(tick);
              }
            } catch (e) {
              reject(e);
            }
          }
          animFrameRef.current = requestAnimationFrame(tick);
        });
      });
  }, [stopCamera]);

  const startScanning = useCallback(async () => {
    setError(null);
    stoppedRef.current = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera requires a secure connection (HTTPS).");
      return;
    }

    setScanning(true);
    try {
      const barcode = await scan();
      if (barcode) {
        setScanning(false);
        setLoading(true);
        const item = await lookupFood(barcode);
        setLoading(false);
        if (!item) {
          setError("No food found for this barcode.");
        } else {
          onFood(item);
        }
      }
    } catch (e) {
      if (stoppedRef.current) return;
      const msg = e instanceof Error ? e.message : String(e);
      setScanning(false);
      setLoading(false);
      if (
        msg.toLowerCase().includes("denied") ||
        msg.toLowerCase().includes("notallowed")
      ) {
        setError("Camera access denied. Please allow camera permissions.");
      } else {
        setError(`Scanner error: ${msg}`);
      }
    }
  }, [scan, onFood]);

  useEffect(() => {
    startScanning();
    return () => stopCamera();
  }, [startScanning, stopCamera]);

  return (
    <>
      <button
        type="button"
        aria-label="Close"
        className="fixed inset-0 bg-black/60 z-40 w-full cursor-default"
        onClick={() => {
          stopCamera();
          onClose();
        }}
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 border-t border-zinc-800 rounded-t-2xl max-w-lg mx-auto overflow-hidden">
        <div className="px-6 pt-5 pb-4 flex items-center justify-between">
          <p className="text-white font-medium">Scan barcode</p>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-zinc-500 hover:text-white transition-colors text-sm"
          >
            Cancel
          </button>
        </div>

        <div
          className="relative mx-6 mb-4 rounded-xl overflow-hidden bg-black"
          style={{ aspectRatio: "4/3" }}
        >
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            playsInline
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-32 border-2 border-white/40 rounded-lg" />
          </div>
        </div>

        <div className="px-6 pb-8 flex flex-col items-center gap-2 min-h-15">
          {scanning && (
            <p className="text-sm text-zinc-400">
              Point camera at a food barcode…
            </p>
          )}
          {loading && <p className="text-sm text-zinc-400">Looking up food…</p>}
          {error && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-red-400">{error}</p>
              <button
                type="button"
                onClick={startScanning}
                className="text-sm text-zinc-400 underline"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
