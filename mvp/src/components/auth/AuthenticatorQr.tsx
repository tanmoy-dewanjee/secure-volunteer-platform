"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function AuthenticatorQr({
  value,
  account,
}: {
  value: string;
  account: string;
}) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (!value) {
      setSrc("");
      return;
    }

    let cancelled = false;
    QRCode.toDataURL(value, {
      width: 196,
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
  }, [value]);

  if (!src) {
    return (
      <div className="flex h-[196px] w-[196px] items-center justify-center bg-white text-sm text-gray-500">
        Generating QR code…
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`Authenticator QR code for ${account}`}
      width={196}
      height={196}
    />
  );
}
