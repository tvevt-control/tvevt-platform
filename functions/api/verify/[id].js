export async function onRequestGet(context) {
  const { id } = context.params;

  return new Response(
    JSON.stringify({
      id,
      timestamp: new Date().toISOString(),
      hash: "demo-hash-not-persisted-yet",
      prev_hash: "0",
      sequence: 1,
      version: "mvp",
      author_id: "anonymous",
      anchor_status: "sealed",
      content: {
        text: "Demo verification response. Persistence is not connected yet.",
        type: "text/plain"
      },
      metadata: {}
    }),
    {
      headers: { "Content-Type": "application/json" }
    }
  );
}
