// app/api/lines/[lineId]/status/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabaseAdmin";

export async function GET(_req, { params }) {
  const lineId = params?.lineId ?? params?.id; // por si quedó algún caller viejo

  try {
    const supabase = getAdminClient();

    const { data: line, error } = await supabase
      .from("lines")
      .select("id, status, last_seen, expires_at")
      .eq("id", lineId)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!line) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const active = !!(line.expires_at && new Date(line.expires_at) > new Date());

    return NextResponse.json({
      status: active ? (line.status || "connected") : "pending",
      last_seen: line.last_seen,
      active,
    });
  } catch (e) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

export async function POST(_req, { params }) {
  const lineId = params?.lineId ?? params?.id;

  try {
    const supabase = getAdminClient();

    const { error } = await supabase
      .from("lines")
      .update({ status: "connected", last_seen: new Date().toISOString() })
      .eq("id", lineId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}