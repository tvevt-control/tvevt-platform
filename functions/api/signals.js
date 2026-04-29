export async function onRequestGet(context) {
  try {
    const store = context.env.STORE || context.env.LOG_STORE;

    if (!store) {
      return new Response(JSON.stringify([]), {
        headers: { "Content-Type": "application/json" }
      });
    }

    const url = new URL(context.request.url);
    const query = (url.searchParams.get("q") || "").toLowerCase().trim();

    const list = await store.list();
    const signals = [];

    for (const key of list.keys) {
      if (!key.name.startsWith("TVE-")) continue;

      const raw = await store.get(key.name);
      if (!raw) continue;

      let record;
      try {
        record = JSON.parse(raw);
      } catch {
        continue;
      }

      const text = record.content?.text || record.text || "";

      const item = {
        id: record.id || key.name,
        timestamp: record.timestamp || record.createdAt || "",
        hash: record.hash || "",
        status: record.anchor_status || "sealed",
        text,
        link: `/record.html?id=${record.id || key.name}`
      };

      if (query) {
        const haystack = [
          item.id,
          item.timestamp,
          item.status,
          item.hash,
          item.text
        ].join(" ").toLowerCase();

        if (!haystack.includes(query)) continue;
      }

      signals.push(item);
    }

    signals.sort((a, b) => {
      return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
    });

    return new Response(JSON.stringify(signals), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
