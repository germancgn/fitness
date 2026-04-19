"use client";

import { BarcodeDetector, type BarcodeFormat } from "barcode-detector/ponyfill";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type FoodInfo = {
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  image: string;
};

export default function FoodScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [food, setFood] = useState<FoodInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    return () => {
      stoppedRef.current = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      const video = videoRef.current;
      if (video?.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach((t) => {
          t.stop();
        });
        video.srcObject = null;
      }
    };
  }, []);

  function stopCamera() {
    stoppedRef.current = true;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const video = videoRef.current;
    if (video?.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach((t) => {
        t.stop();
      });
      video.srcObject = null;
    }
  }

  async function stopScanning() {
    stopCamera();
    setScanning(false);
  }

  async function startScanning() {
    setError(null);
    setFood(null);
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
        await lookupFood(barcode);
      }
    } catch (e) {
      if (stoppedRef.current) return;
      const msg = e instanceof Error ? e.message : String(e);
      setScanning(false);
      if (
        msg.toLowerCase().includes("denied") ||
        msg.toLowerCase().includes("notallowed")
      ) {
        setError("Camera access denied. Please allow camera permissions.");
      } else {
        setError(`Scanner error: ${msg}`);
      }
    }
  }

  async function scan(): Promise<string | null> {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });
    const video = videoRef.current;
    if (!video) {
      stream.getTracks().forEach((t) => {
        t.stop();
      });
      return null;
    }
    video.srcObject = stream;
    await video.play();

    const supported = await BarcodeDetector.getSupportedFormats();
    const wanted: BarcodeFormat[] = ["ean_13", "ean_8", "upc_a", "upc_e"];
    const formats = wanted.filter((f) => supported.includes(f));
    const detector = new BarcodeDetector(
      formats.length > 0 ? { formats } : undefined,
    );

    return new Promise((resolve, reject) => {
      async function scan() {
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
            animFrameRef.current = requestAnimationFrame(scan);
          }
        } catch (e) {
          reject(e);
        }
      }
      animFrameRef.current = requestAnimationFrame(scan);
    });
  }

  async function lookupFood(barcode: string) {
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      );
      const data = await res.json();
      if (data.status !== 1) {
        setError(`No food found for barcode ${barcode}.`);
        return;
      }
      const p = data.product;
      const n = (p.nutriments ?? {}) as Record<
        string,
        string | number | undefined
      >;
      setFood({
        name: p.product_name || "Unknown product",
        calories: String(n["energy-kcal_100g"] ?? n["energy-kcal"] ?? "N/A"),
        protein: String(n.proteins_100g ?? "N/A"),
        carbs: String(n.carbohydrates_100g ?? "N/A"),
        fat: String(n.fat_100g ?? "N/A"),
        image: p.image_url ?? "",
      });
    } catch {
      setError("Failed to fetch food information.");
    }
  }

  function reset() {
    stopCamera();
    setScanning(false);
    setFood(null);
    setError(null);
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6 w-full max-w-lg">
      <h1 className="text-2xl font-bold">Food Scanner</h1>

      <video
        ref={videoRef}
        className={`w-full rounded-xl aspect-video bg-black object-cover ${scanning ? "block" : "hidden"}`}
        muted
        playsInline
      />

      {!scanning && !food && (
        <button
          type="button"
          onClick={startScanning}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
        >
          Scan Barcode
        </button>
      )}

      {scanning && (
        <button
          onClick={stopScanning}
          className="px-6 py-3 bg-red-400 text-white rounded-xl font-semibold hover:bg-red-500"
          type="button"
        >
          Stop Scanning
        </button>
      )}

      {scanning && (
        <p className="text-sm text-gray-500">Point camera at a food barcode…</p>
      )}

      {error && (
        <div className="text-red-600 text-sm text-center">
          {error}
          <button
            type="button"
            onClick={reset}
            className="block mt-2 underline"
          >
            Try again
          </button>
        </div>
      )}

      {food && (
        <div className="w-full rounded-xl border p-4 flex flex-col gap-3">
          {food.image && (
            <div className="relative w-full h-40">
              <Image
                src={food.image}
                alt={food.name}
                fill
                className="object-contain rounded-lg"
              />
            </div>
          )}
          <h2 className="font-semibold text-lg">{food.name}</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Stat label="Calories" value={`${food.calories} kcal`} />
            <Stat label="Protein" value={`${food.protein} g`} />
            <Stat label="Carbs" value={`${food.carbs} g`} />
            <Stat label="Fat" value={`${food.fat} g`} />
          </div>
          <button
            type="button"
            onClick={reset}
            className="mt-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm"
          >
            Scan another
          </button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
