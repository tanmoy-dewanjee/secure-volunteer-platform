"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function QrCodeImage({
  value,
  label,
  size = 196,
}: {
  value: string;
  label: string;
  size?: number;
}) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (!value) {
      setSrc("");
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#171717", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setSrc("");
      });
    return () => {
      cancelled = true;
    };
  }, [size, value]);

  if (!src) {
    return (
      <div
        className="flex items-center justify-center bg-white text-sm text-gray-500"
        style={{ width: size, height: size }}
      >
        Generating QR…
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={label} width={size} height={size} />
  );
}
