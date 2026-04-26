export async function onRequestGet(context) {
  const { env } = context;

  const list = await env.STORE.list();
  const leads = [];

  for (const key of list.keys) {
    const value = await env.STORE.get(key.name);

    if (value) {
      try {
        const data = JSON.parse(value);
        leads.push(data);
      } catch (e) {}
    }
  }

  return new Response(JSON.stringify(leads), {
    headers: { 'Content-Type': 'application/json' }
  });
}
