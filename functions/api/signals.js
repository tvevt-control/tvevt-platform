export async function onRequestGet(context) {
  try {
    const store = context.env.STORE || context.env.LOG_STORE;
    const adminKey = context.env.SIGNALS_ADMIN_KEY;

    const url = new URL(context.request.url);
    const key = url.searchParams.get("key") || "";
    const query = (url.searchParams.get("q") || "").toLowerCase().trim();

    if (!adminKey || key !== adminKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!store) {
      return new Response(JSON.stringify([]), {
        headers: { "Content-Type": "application/json" }
      });
    }

    const list = await store.list();
    const signals = [];

    for (const item of list.keys) {
      if (!item.name.startsWith("TVE-")) continue;

      const raw = await store.get(item.name);
      if (!raw) continue;

      let record;
      try {
        record = JSON.parse(raw);
      } catch {
        continue;
      }

      const text = record.content?.text || record.text || "";

      const signal = {
        id: record.id || item.name,
        timestamp: record.timestamp || record.createdAt || "",
        hash: record.hash || "",
        status: record.anchor_status || "sealed",
        text,
        link: `/record.html?id=${record.id || item.name}`
      };

      if (query) {
        const haystack = [
          signal.id,
          signal.timestamp,
          signal.status,
          signal.hash,
          signal.text
        ].join(" ").toLowerCase();

        if (!haystack.includes(query)) continue;
      }

      signals.push(signal);
    }

    signals.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

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
