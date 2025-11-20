"use client";

import { QRCodeCanvas } from "qrcode.react";

type QRProps = {
  value: string;
  size?: number;
};

export default function QR({ value, size = 180 }: QRProps) {
  return (
    <QRCodeCanvas
      value={value}
      size={size}
      includeMargin
      style={{ borderRadius: 16 }}
    />
  );
}
