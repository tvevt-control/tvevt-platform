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
      text
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await store.put(id, JSON.stringify(lead));

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

    await sendTelegram(context.env, message);
    await sendEmail(context.env, lead);

    return new Response(JSON.stringify({ ok:true, id, clientKey, consoleUrl }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ ok:false, error:err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

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
        if (lead.clientKey === accessToken || lead.accessToken === accessToken) {
          return new Response(JSON.stringify({
            valid: true,
            id: lead.id || key.name,
            name: lead.name || "",
            email: lead.email || "",
            status: lead.status || "NEW",
            clientKey: lead.clientKey || "",
            consoleUrl: lead.consoleUrl || ""
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
          clientKey: lead.clientKey || "",
          consoleUrl: lead.consoleUrl || "",
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
