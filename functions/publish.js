export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const text = body.text || body.content || "";

    if (!text) {
      return new Response(JSON.stringify({ error: "No text provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const id = "TVE-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const timestamp = new Date().toISOString();

    const encoder = new TextEncoder();
    const data = encoder.encode(text + timestamp);

    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    const record = {
      id,
      timestamp,
      sequence: 1,
      prev_hash: "0",
      hash,
      version: "mvp",
      author_id: "anonymous",
      anchor_status: "sealed",
      content: {
        text,
        type: "text/plain"
      },
      metadata: {}
    };

    await context.env.STORE.put(id, JSON.stringify(record));

    return new Response(JSON.stringify({
      id,
      timestamp,
      hash,
      verification_url: `https://tvevt.com/record.html?id=${id}`
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
