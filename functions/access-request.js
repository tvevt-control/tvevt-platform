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

async function sendEmail(env, lead) {
  if (!env.RESEND_API_KEY || !lead.email) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "TVEVT <onboarding@resend.dev>",
      to: [lead.email],
      bcc: ["max@fincib.com"],
      subject: "Your TVEVT access request was received",
      html: `
        <p>Hi ${lead.name || "there"},</p>
        <p>Your TVEVT access request has been received.</p>
        <p>Your private console link:</p>
        <p><a href="${lead.consoleUrl}">${lead.consoleUrl}</a></p>
        <p>Please keep this link private.</p>
        <p>— TVEVT</p>
      `
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
      createdAt: new Date().toISOString()
    };

    if (store) {
      await store.put(id, JSON.stringify(lead));
    }

    await sendTelegram(
      context.env,
`🚀 NEW TVEVT ACCESS REQUEST

ID: ${id}
Name: ${lead.name}
Email: ${lead.email}
Status: NEW

Generated client key:
${clientKey}

Private console:
${consoleUrl}`
    );

    await sendEmail(context.env, lead);

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

export async function onRequestGet() {
  return Response.redirect("https://tvevt.com/request-access.html", 302);
}
