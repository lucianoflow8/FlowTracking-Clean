// app/api/lines/[id]/qr/route.js
// Ruta API de Next que actúa como proxy hacia tu backend de WhatsApp.
// - POST: devuelve { status, qr, phone? } desde `${API_BASE}/lines/:id/qr`
// - GET : proxya la imagen PNG del QR desde `${API_BASE}/lines/:id/qr.png`
// Si no hay backend configurado, GET genera un QR local de prueba.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import QR from "qrcode";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || process.env.WA_API_BASE || "").replace(/\/$/, "");

// POST -> proxy al backend para obtener el dataURL del QR (JSON)
export async function POST(_req, { params }) {
  const { id } = params;

  if (!API_BASE) {
    return new Response(JSON.stringify({ error: "api_base_not_configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = `${API_BASE}/lines/${encodeURIComponent(id)}/qr`;

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const body = await upstream.text(); // passthrough
    return new Response(body, {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("content-type") || "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "qr_proxy_failed", detail: e?.message || String(e) }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}

// GET -> proxy de la imagen PNG del QR; si no hay backend, genera un QR local
export async function GET(_req, { params }) {
  const { id } = params;

  if (API_BASE) {
    const url = `${API_BASE}/lines/${encodeURIComponent(id)}/qr.png`;
    try {
      const upstream = await fetch(url);
      if (!upstream.ok) {
        const txt = await upstream.text().catch(() => "");
        return new Response(`Upstream error: ${txt}`, { status: 502 });
      }
      return new Response(upstream.body, {
        status: 200,
        headers: {
          "Content-Type": upstream.headers.get("content-type") || "image/png",
          "Cache-Control": "no-store",
        },
      });
    } catch {
      // cae al fallback local abajo
    }
  }

  // Fallback local (placeholder) si no hay backend disponible
  try {
    const payload = JSON.stringify({ line: id, t: Date.now() });
    const dataUrl = await QR.toDataURL(payload, {
      width: 512,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    });
    const base64 = dataUrl.split(",")[1];
    return new Response(Buffer.from(base64, "base64"), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return new Response(`QR error: ${e?.message || String(e)}`, { status: 500 });
  }
}