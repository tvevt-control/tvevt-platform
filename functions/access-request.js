function generateId(prefix) {
  const bytes = crypto.getRandomValues(new Uint8Array(8));

  const randomPart = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

  return `${prefix}-${randomPart}`;
}

function makeEmailLookupKey(email) {
  return `email:${String(email || "").trim().toLowerCase()}`;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function sendTelegram(env, text) {
  if (!env.TG_TOKEN || !env.TG_CHAT_ID) {
    return;
  }

  const response = await fetch(
    `https://api.telegram.org/bot${env.TG_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: env.TG_CHAT_ID,
        text,
        parse_mode: "HTML"
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    console.error("Telegram API error:", errorText);
  }
}

async function sendEmail(env, lead, isResend = false) {
  if (!env.RESEND_API_KEY || !lead.email) {
    return;
  }

  const subject = isResend
    ? "Your TVEVT private access link"
    : "Your TVEVT access request was received";

  const intro = isResend
    ? "Your TVEVT access is already active. We resent your private console link below."
    : "Your TVEVT access request has been received.";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "TVEVT <onboarding@resend.dev>",
      to: [lead.email],
      bcc: ["max@fincib.com"],
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111111;">
          <p>Hi ${escapeHtml(lead.name || "there")},</p>

          <p>${escapeHtml(intro)}</p>

          <p>
            <strong>Your private console:</strong>
          </p>

          <p>
            <a href="${lead.consoleUrl}">
              ${lead.consoleUrl}
            </a>
          </p>

          <p>Please keep this link private.</p>

          <p>— TVEVT</p>
        </div>
      `
    })
  });

  if (!response.ok) {
    const errorText = await response.text();

    console.error("Resend API error:", errorText);
  }
}

export async function onRequestPost(context) {
  try {
    const store = context.env.STORE || context.env.LOG_STORE;

    if (!store) {
      throw new Error("Storage binding not configured");
    }

    const data = await context.request.json();

    const email = String(data.email || "")
      .trim()
      .toLowerCase();

    const name = String(data.name || "").trim();

    const message = String(data.message || "").trim();

    if (!email) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Email is required"
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const emailLookupKey = makeEmailLookupKey(email);

    const existingLeadId = await store.get(emailLookupKey);

    if (existingLeadId) {
      const existingRaw = await store.get(existingLeadId);

      if (existingRaw) {
        const existingLead = JSON.parse(existingRaw);

        existingLead.lastRequestAt = new Date().toISOString();

        existingLead.requestCount =
          (existingLead.requestCount || 1) + 1;

        existingLead.status = "RESENT";

        await store.put(
          existingLead.id,
          JSON.stringify(existingLead)
        );

        await sendTelegram(
          context.env,
`🔁 <b>TVEVT ACCESS LINK RESENT</b>

Name: ${escapeHtml(existingLead.name)}
Email: ${escapeHtml(existingLead.email)}
Status: RESENT

Client Key:
${escapeHtml(existingLead.clientKey)}

Private Console:
${escapeHtml(existingLead.consoleUrl)}`
        );

        await sendEmail(
          context.env,
          existingLead,
          true
        );

        return new Response(
          JSON.stringify({
            ok: true,
            resent: true,
            id: existingLead.id,
            clientKey: existingLead.clientKey,
            consoleUrl: existingLead.consoleUrl
          }),
          {
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
      }
    }

    const id = generateId("REQ");

    const clientKey = generateId("CLIENT");

    const consoleUrl =
      `https://tvevt.com/console.html?key=${clientKey}`;

    const now = new Date().toISOString();

    const lead = {
      id,
      name,
      email,
      message,
      status: "NEW",
      clientKey,
      consoleUrl,
      requestCount: 1,
      createdAt: now,
      lastRequestAt: now
    };

    /*
      KV is eventually consistent.
      Full transactional identity protection
      will later migrate to D1.
    */

    await store.put(id, JSON.stringify(lead));

    await store.put(emailLookupKey, id);

    await sendTelegram(
      context.env,
`🚀 <b>NEW TVEVT ACCESS REQUEST</b>

ID: ${escapeHtml(id)}
Name: ${escapeHtml(lead.name)}
Email: ${escapeHtml(lead.email)}
Status: NEW

Client Key:
${escapeHtml(clientKey)}

Private Console:
${escapeHtml(consoleUrl)}`
    );

    await sendEmail(
      context.env,
      lead,
      false
    );

    return new Response(
      JSON.stringify({
        ok: true,
        resent: false,
        id,
        clientKey,
        consoleUrl
      }),
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

  } catch (err) {
    console.error("Access request error:", err);

    return new Response(
      JSON.stringify({
        ok: false,
        error: err.message
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}

export async function onRequestGet() {
  return Response.redirect(
    "https://tvevt.com/request-access.html",
    302
  );
}
