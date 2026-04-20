export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const text = body.text || "empty";

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
      hash,
      prev_hash: "0",
      sequence: 1,
      version: "mvp",
      author_id: "anonymous",
      anchor_status: "sealed",
      content: {
        text,
        type: "text/plain"
      },
      metadata: {}
    };

    return new Response(JSON.stringify(record), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
