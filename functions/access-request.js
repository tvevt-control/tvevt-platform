function makeId(prefix) {
  return prefix + "-" + Math.random().toString(36).substring(2, 10).toUpperCase();
}

async function sendTelegram(env, text) {
  if (!env.TG_TOKEN || !env.TG_CHAT_ID) return;

  await fetch(`https://api.telegram.org/bot${env.TG_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: env.TG_CHAT_ID,
      text,
      parse_mode: "HTML"
    })
  });
}

export async function onRequestPost(context) {
  try {
    const store = context.env.STORE || context.env.LOG_STORE;
    const data = await context.request.json();

    const id = makeId("REQ");
    const clientKey = makeId("CLIENT");
    const consoleUrl = `https://tvevt.com/console.html?key=${clientKey}`;

    const lead = {
      id,
      name: data.name || "",
      email: data.email || "",
      message: data.message || "",
      status: "NEW",
      clientKey,
      consoleUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await store.put(id, JSON.stringify(lead));

    const approveUrl = `https://tvevt.com/api/lead-action?id=${id}&action=approve`;
    const rejectUrl = `https://tvevt.com/api/lead-action?id=${id}&action=reject`;

    await sendTelegram(context.env, `
🚀 NEW TVEVT ACCESS REQUEST

ID: ${id}
Name: ${lead.name}
Email: ${lead.email}
Status: NEW

Generated client key:
${clientKey}

Private console:
${consoleUrl}

Approve:
${approveUrl}

Reject:
${rejectUrl}
`);

    return new Response(JSON.stringify({
      ok: true,
      id,
      clientKey,
      consoleUrl
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      ok: false,
      error: err.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
