// app/api/lines/[lineId]/qr/route.js
// Proxy a tu backend de WhatsApp para generar/leer el QR.
// - POST: devuelve JSON desde `${API_BASE}/lines/:lineId/qr`
// - GET : proxya `${API_BASE}/lines/:lineId/qr.png`; si no hay backend, genera un QR local.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import QR from "qrcode";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || process.env.WA_API_BASE || "").replace(/\/$/, "");

// ---------- POST -> proxy JSON ----------
export async function POST(_req, { params }) {
  const lineId = params.lineId;

  if (!API_BASE) {
    return new Response(JSON.stringify({ error: "api_base_not_configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = `${API_BASE}/lines/${encodeURIComponent(lineId)}/qr`;

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const body = await upstream.text(); // passthrough tal cual
    return new Response(body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "qr_proxy_failed", detail: e?.message || String(e) }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}

// ---------- GET -> proxy imagen PNG (o QR local si no hay backend) ----------
export async function GET(_req, { params }) {
  const lineId = params.lineId;

  if (API_BASE) {
    const url = `${API_BASE}/lines/${encodeURIComponent(lineId)}/qr.png`;
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
      // si falla proxy, caemos al fallback local
    }
  }

  // Fallback local: QR de prueba (sirve para verificar el flujo sin backend)
  try {
    const payload = JSON.stringify({ line: lineId, t: Date.now() });
    const dataUrl = await QR.toDataURL(payload, { width: 512, margin: 1, color: { dark: "#000000", light: "#ffffff" } });
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