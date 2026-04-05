"use client";

import { useState } from "react";
import QRCode from "qrcode.react";
import { Download, Copy, CheckCheck, ExternalLink } from "lucide-react";

interface PetQRProps {
  mascotaId: string;
  mascotaNombre?: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bqrs.vercel.app";

export function PetQR({ mascotaId, mascotaNombre }: PetQRProps) {
  const url = `${BASE_URL}/pet/${mascotaId}`;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const canvas = document.querySelector(`#qr-${mascotaId} canvas`) as HTMLCanvasElement;
    if (!canvas) return;
    const size = 1200;
    const offscreen = document.createElement("canvas");
    offscreen.width = size;
    offscreen.height = size;
    const ctx = offscreen.getContext("2d")!;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, size, size);
    const padding = 80;
    ctx.drawImage(canvas, padding, padding, size - padding * 2, size - padding * 2);
    const link = document.createElement("a");
    link.download = `bqr-${mascotaNombre || mascotaId}.png`;
    link.href = offscreen.toDataURL("image/png");
    link.click();
  };

  const btnStyle = {
    display: "flex", alignItems: "center", gap: "0.375rem",
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,196,204,0.3)",
    borderRadius: "0.75rem", padding: "0.5rem 1rem", color: "#cbd5e1",
    fontSize: "0.875rem", fontWeight: 500, cursor: "pointer",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
      <div id={`qr-${mascotaId}`} style={{ background: "white", borderRadius: "1rem", padding: "1rem", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
        <QRCode value={url} size={220} level="H" includeMargin={true} renderAs="canvas" />
      </div>
      <p style={{ color: "#64748b", fontSize: "0.75rem", textAlign: "center", maxWidth: 280, wordBreak: "break-all" }}>{url}</p>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button onClick={handleCopy} style={btnStyle}>
          {copied ? <><CheckCheck style={{ width: 16, height: 16, color: "#00C4CC" }} />Copiado</> : <><Copy style={{ width: 16, height: 16 }} />Copiar URL</>}
        </button>
        <button onClick={handleDownload} style={{ ...btnStyle, color: "#00C4CC", borderColor: "rgba(0,196,204,0.4)" }}>
          <Download style={{ width: 16, height: 16 }} />Descargar PNG
        </button>
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#475569", fontSize: "0.75rem", textDecoration: "none" }}>
        <ExternalLink style={{ width: 12, height: 12 }} />Probar página del rescatador
      </a>
    </div>
  );
}