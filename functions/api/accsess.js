export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(JSON.stringify({ valid: false }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    const list = await context.env.STORE.list();

    for (const key of list.keys) {
      if (!key.name.startsWith("REQ-")) continue;

      const raw = await context.env.STORE.get(key.name);
      if (!raw) continue;

      const lead = JSON.parse(raw);

      if (lead.accessToken === token && lead.status === "APPROVED") {
        return new Response(JSON.stringify({
          valid: true,
          id: lead.id,
          name: lead.name,
          email: lead.email,
          status: lead.status
        }), {
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    return new Response(JSON.stringify({ valid: false }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ valid: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
