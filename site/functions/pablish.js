export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    const id = "TVE-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const timestamp = new Date().toISOString();

    const record = {
      id,
      timestamp,
      hash: crypto.randomUUID(),
      content: body.content || "empty",
      version: "v1"
    };

    // 🔥 ВОТ ЭТО ГЛАВНОЕ — СОХРАНЕНИЕ В KV
    await context.env.STORE.put(id, JSON.stringify(record));

    return new Response(JSON.stringify({
      id,
      timestamp,
      hash: record.hash,
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
