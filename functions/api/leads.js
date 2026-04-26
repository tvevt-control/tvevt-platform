export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const accessToken = url.searchParams.get("access");

    const store = context.env.STORE || context.env.LOG_STORE;

    if (!store) {
      return new Response(JSON.stringify(accessToken ? { valid: false } : []), {
        headers: { "Content-Type": "application/json" }
      });
    }

    const list = await store.list();
    const leads = [];

    for (const key of list.keys) {
      if (!key.name.startsWith("REQ-")) continue;

      const raw = await store.get(key.name);
      if (!raw) continue;

      const lead = JSON.parse(raw);

      if (accessToken) {
        if (lead.accessToken === accessToken && lead.status === "APPROVED") {
          return new Response(JSON.stringify({
            valid: true,
            id: lead.id || key.name,
            name: lead.name || "",
            email: lead.email || "",
            status: lead.status
          }), {
            headers: { "Content-Type": "application/json" }
          });
        }
      } else {
        leads.push({
          id: lead.id || key.name,
          name: lead.name || "—",
          email: lead.email || "—",
          status: lead.status || "NEW",
          createdAt: lead.createdAt || "",
          updatedAt: lead.updatedAt || ""
        });
      }
    }

    if (accessToken) {
      return new Response(JSON.stringify({ valid: false }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    leads.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

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
