export async function onRequestGet(context) {
  try {
    if (!context.env.STORE) {
      return new Response(JSON.stringify([]), {
        headers: { "Content-Type": "application/json" }
      });
    }

    const list = await context.env.STORE.list();
    const leads = [];

    for (const key of list.keys) {
      if (!key.name.startsWith("REQ-")) continue;

      const raw = await context.env.STORE.get(key.name);
      if (!raw) continue;

      const lead = JSON.parse(raw);

      leads.push({
        id: lead.id || key.name,
        name: lead.name || "—",
        email: lead.email || "—",
        status: lead.status || "NEW",
        createdAt: lead.createdAt || "",
        updatedAt: lead.updatedAt || ""
      });
    }

    leads.sort((a, b) => {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return new Response(JSON.stringify(leads), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
