function randomId() {
  return "TVE-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hashBuffer)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function onRequestPost(context) {
  try {
    const store = context.env.STORE || context.env.LOG_STORE;

    if (!store) {
      return new Response(JSON.stringify({ error: "Storage not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const body = await context.request.json();

    const text = (body.text || "").trim();
    const key = (body.key || "").trim();

    if (!text) {
      return new Response(JSON.stringify({ error: "Missing text" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const id = randomId();
    const timestamp = new Date().toISOString();
    const hash = await sha256(text);

    const record = {
      id,
      text,
      content: { text },
      key,
      timestamp,
      hash,
      status: "sealed",
      anchor_status: "sealed",
      type: "Verified Signal",
      verification_url: `https://tvevt.com/record.html?id=${id}`
    };

    await store.put(id, JSON.stringify(record));

    return new Response(JSON.stringify(record), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
