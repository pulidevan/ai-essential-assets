// AI Essentials — one-time interview invite gate (Cloudflare Worker)
//
// Bindings to set in Cloudflare (Settings → Variables and Secrets / Bindings):
//   ELEVEN_API_KEY   (Secret)  ElevenLabs API key with Agents access
//   INVITE_SECRET    (Secret)  the same secret shown in the Interview Hub
//   INVITES          (KV namespace binding)
//
// Endpoints (all CORS-enabled for the interview page):
//   GET  /check?t=TOKEN  → { name, status: "new" | "started" | "used" }
//   POST /start  {t}     → { name, phone, conversation_token, signed_url }  (marks the invite as used)
//   POST /done   {t}     → { ok }  (closes the invite after a finished interview)

const AGENT_ID = "agent_7801m7m6ywp8fqgrf65ffy86gnv0";
const ALLOWED_ORIGINS = ["https://pulidevan.github.io"];
const RECONNECT_WINDOW_MS = 20 * 60 * 1000; // a dropped call can reconnect within 20 min of first start
const MAX_STARTS = 3;                         // …at most 3 connections in total

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    };
    const json = (body, status = 200) =>
      new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });

    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    if (path === "/") return json({ ok: true, service: "ai-essentials-invites" });

    let t = url.searchParams.get("t");
    if (!t && req.method === "POST") { try { t = (await req.json()).t; } catch (_) {} }
    const inv = await verify(t, env.INVITE_SECRET);
    if (!inv) return json({ error: "invalid" }, 400);
    if (inv.e && Date.now() / 1000 > inv.e) return json({ error: "expired", name: inv.n }, 410);

    const key = "inv:" + inv.x;
    const rec = JSON.parse((await env.INVITES.get(key)) || "null");
    const now = Date.now();
    const used = !!rec && (rec.done || rec.starts >= MAX_STARTS || now - rec.first > RECONNECT_WINDOW_MS);

    if (path === "/check") return json({ name: inv.n, status: used ? "used" : rec ? "started" : "new" });

    if (path === "/start" && req.method === "POST") {
      if (used) return json({ error: "used", name: inv.n }, 410);
      const headers = { "xi-api-key": env.ELEVEN_API_KEY };
      const [tok, sig] = await Promise.all([
        fetch(`https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${AGENT_ID}`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${AGENT_ID}`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
      ]);
      if (!tok?.token && !sig?.signed_url) return json({ error: "upstream" }, 502);
      await env.INVITES.put(key, JSON.stringify({
        n: inv.n, p: inv.p, first: rec?.first || now, starts: (rec?.starts || 0) + 1, done: false,
      }), { expirationTtl: 60 * 60 * 24 * 120 });
      return json({ name: inv.n, phone: inv.p, conversation_token: tok?.token || null, signed_url: sig?.signed_url || null });
    }

    if (path === "/done" && req.method === "POST") {
      if (rec) await env.INVITES.put(key, JSON.stringify({ ...rec, done: true, doneAt: now }), { expirationTtl: 60 * 60 * 24 * 120 });
      return json({ ok: true });
    }

    return json({ error: "not_found" }, 404);
  },
};

/* Token = base64url(JSON payload) + "." + base64url(HMAC-SHA256(INVITE_SECRET, payload)) */
async function verify(token, secret) {
  if (!token || !secret || typeof token !== "string" || !token.includes(".")) return null;
  const [p, s] = token.split(".");
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  let ok = false;
  try { ok = await crypto.subtle.verify("HMAC", k, b64d(s), new TextEncoder().encode(p)); } catch (_) { return null; }
  if (!ok) return null;
  try {
    const inv = JSON.parse(new TextDecoder().decode(b64d(p)));
    return inv && inv.x ? inv : null;
  } catch (_) { return null; }
}
function b64d(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(s + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}
