function makeId(prefix) {
  return prefix + "-" + Math.random().toString(36).substring(2, 10).toUpperCase();
}

async function sendTelegram(env, text, approveUrl, rejectUrl) {
  if (!env.TG_TOKEN || !env.TG_CHAT_ID) return;

  await fetch(`https://api.telegram.org/bot${env.TG_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: env.TG_CHAT_ID,
      text,
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✅ Approve", url: approveUrl },
            { text: "❌ Reject", url: rejectUrl }
          ]
        ]
      }
    })
  });
}

export async function onRequestPost(context) {
  try {
    const store = context.env.STORE || context.env.LOG_STORE;

    if (!store) {
      return new Response(JSON.stringify({ ok:false, error:"Storage not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const data = await context.request.json();

    const name = (data.name || "").trim();
    const email = (data.email || "").trim();

    if (!name || !email) {
      return new Response(JSON.stringify({ ok:false, error:"Missing name or email" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const id = makeId("REQ");
    const clientKey = makeId("CLIENT");
    const consoleUrl = `https://tvevt.com/console.html?key=${clientKey}`;

    const lead = {
      id,
      name,
      email,
      status: "NEW",
      clientKey,
      consoleUrl,
      createdAt: new Date().toISOString()
    };

    await store.put(id, JSON.stringify(lead));

    const approveUrl = `https://tvevt.com/api/lead-action?id=${id}&action=approve`;
    const rejectUrl = `https://tvevt.com/api/lead-action?id=${id}&action=reject`;

    const message =
`🚀 NEW TVEVT ACCESS REQUEST

ID: ${id}
Name: ${name}
Email: ${email}
Status: NEW

Generated client key:
${clientKey}

Private console:
${consoleUrl}`;

    await sendTelegram(context.env, message, approveUrl, rejectUrl);

    return new Response(JSON.stringify({
      ok: true,
      id,
      clientKey,
      consoleUrl
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ ok:false, error:err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
