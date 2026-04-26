export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);

    const token =
      url.searchParams.get("token") ||
      url.searchParams.get("access");

    if (!token) {
      return new Response(JSON.stringify({ valid: false, reason: "NO_TOKEN" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    const store = context.env.STORE || context.env.LOG_STORE;

    if (!store) {
      return new Response(JSON.stringify({ valid: false, reason: "NO_STORE" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    const list = await store.list();

    for (const key of list.keys) {
      if (!key.name.startsWith("REQ-")) continue;

      const raw = await store.get(key.name);
      if (!raw) continue;

      const lead = JSON.parse(raw);

      if (lead.accessToken === token && lead.status === "APPROVED") {
        return new Response(JSON.stringify({
          valid: true,
          id: lead.id,
          name: lead.name || "",
          email: lead.email || "",
          status: lead.status
        }), {
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    return new Response(JSON.stringify({ valid: false, reason: "NOT_FOUND" }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      valid: false,
      reason: "ERROR",
      message: err.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
