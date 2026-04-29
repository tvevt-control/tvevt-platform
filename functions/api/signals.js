export async function onRequestGet(context) {
  try {
    const store = context.env.STORE || context.env.LOG_STORE;

    const url = new URL(context.request.url);
    const key = url.searchParams.get("key") || "";
    const query = (url.searchParams.get("q") || "").toLowerCase().trim();

    if (!key) {
      return new Response(JSON.stringify({ error: "Missing key" }), {
        status: 403,
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

      /*
        ADMIN KEY:
        TVEVT-MAX-2026 sees all existing signals.
        Future client keys will see only records with matching key.
      */
      if (key !== "TVEVT-MAX-2026") {
        if (record.key !== key) continue;
      }

      const text = record.content?.text || record.text || "";

      const signal = {
        id: record.id || item.name,
        timestamp: record.timestamp || record.createdAt || "",
        hash: record.hash || "",
        status: record.anchor_status || record.status || "sealed",
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
