function randomId() {
  return "TVE-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

export async function onRequestPost(context) {
  try {
    const store = context.env.STORE || context.env.LOG_STORE;

    if (!store) {
      return json({ ok: false, error: "Storage not configured" }, 500);
    }

    const body = await context.request.json();

    const text = String(body.text || "").trim();
    const key = String(body.key || body.clientKey || "").trim();

    if (!text) {
      return json({ ok: false, error: "Missing text" }, 400);
    }

    const id = randomId();
    const timestamp = new Date().toISOString();
    const hash = await sha256(text);

    const recordUrl = `https://tvevt.com/record.html?id=${id}`;

    const record = {
      id,
      type: "Verified Signal",
      text,
      content: { text },
      key,
      clientKey: key || null,
      visibility: key ? "private" : "public",
      timestamp,
      createdAt: timestamp,
      hash,
      status: "sealed",
      anchor_status: "sealed",
      verification_url: recordUrl,
      recordUrl
    };

    await store.put(id, JSON.stringify(record));

    return json({
      ok: true,
      id,
      hash,
      verification_url: recordUrl,
      recordUrl,
      record
    });

  } catch (err) {
    return json(
      {
        ok: false,
        error: err.message || "Publish failed"
      },
      500
    );
  }
}

export async function onRequestGet() {
  return json({
    ok: true,
    endpoint: "/api/publish",
    method: "POST"
  });
}
