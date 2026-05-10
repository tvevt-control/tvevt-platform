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

function isAdminRequest(request, env, url) {
  const tokenFromQuery =
    url.searchParams.get("admin_token");

  const tokenFromHeader =
    request.headers.get("x-admin-token");

  const authHeader =
    request.headers.get("authorization") || "";

  const tokenFromBearer =
    authHeader.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "").trim()
      : "";

  const adminToken = env.ADMIN_TOKEN;

  if (!adminToken) {
    return false;
  }

  return (
    tokenFromQuery === adminToken ||
    tokenFromHeader === adminToken ||
    tokenFromBearer === adminToken
  );
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
    console.error(
      "Telegram API error:",
      await response.text()
    );
  }
}

async function sendEmail(
  env,
  lead,
  isResend = false
) {
  if (!env.RESEND_API_KEY || !lead.email) {
    return;
  }

  const subject = isResend
    ? "Your TVEVT private access link"
    : "Your TVEVT access request was received";

  const intro = isResend
    ? "Your TVEVT access is already active. We resent your private console link below."
    : "Your TVEVT access request has been received.";

  const response = await fetch(
    "https://api.resend.com/emails",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "TVEVT Access <access@mail.tvevt.com>",
        to: [lead.email],
        bcc: ["max@fincib.com"],
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111111;">
            <p>
              Hi ${escapeHtml(lead.name || "there")},
            </p>

            <p>
              ${escapeHtml(intro)}
            </p>

            <p>
              <strong>
                Your private console:
              </strong>
            </p>

            <p>
              <a href="${lead.consoleUrl}">
                ${lead.consoleUrl}
              </a>
            </p>

            <p>
              Please keep this link private.
            </p>

            <p>
              — TVEVT
            </p>
          </div>
        `
      })
    }
  );

  if (!response.ok) {
    console.error(
      "Resend API error:",
      await response.text()
    );
  }
}

export async function onRequestPost(context) {
  try {
    const store =
      context.env.STORE ||
      context.env.LOG_STORE;

    if (!store) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Storage not configured"
        }),
        {
          status: 500,
          headers: {
            "Content-Type":
              "application/json"
          }
        }
      );
    }

    const data =
      await context.request.json();

    const name = String(data.name || "")
      .trim();

    const email = String(data.email || "")
      .trim()
      .toLowerCase();

    if (!name || !email) {
      return new Response(
        JSON.stringify({
          ok: false,
          error:
            "Missing name or email"
        }),
        {
          status: 400,
          headers: {
            "Content-Type":
              "application/json"
          }
        }
      );
    }

    const emailLookupKey =
      makeEmailLookupKey(email);

    const existingLeadId =
      await store.get(emailLookupKey);

    /*
      EXISTING USER
      RESEND EXISTING ACCESS
    */

    if (existingLeadId) {
      const existingRaw =
        await store.get(existingLeadId);

      if (existingRaw) {
        const existingLead =
          JSON.parse(existingRaw);

        const now =
          new Date().toISOString();

        existingLead.status =
          "RESENT";

        existingLead.requestCount =
          (existingLead.requestCount || 1) + 1;

        existingLead.updatedAt =
          now;

        existingLead.lastRequestAt =
          now;

        await store.put(
          existingLead.id,
          JSON.stringify(existingLead)
        );

        await sendEmail(
          context.env,
          existingLead,
          true
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

        return new Response(
          JSON.stringify({
            ok: true,
            resent: true,
            id: existingLead.id,
            clientKey:
              existingLead.clientKey,
            consoleUrl:
              existingLead.consoleUrl
          }),
          {
            headers: {
              "Content-Type":
                "application/json"
            }
          }
        );
      }
    }

    /*
      NEW USER
      CREATE IDENTITY
    */

    const id =
      generateId("REQ");

    const clientKey =
      generateId("CLIENT");

    const consoleUrl =
      `https://tvevt.com/console.html?key=${clientKey}`;

    const now =
      new Date().toISOString();

    const lead = {
      id,
      name,
      email,
      status: "NEW",
      clientKey,
      consoleUrl,
      requestCount: 1,
      createdAt: now,
      updatedAt: now,
      lastRequestAt: now
    };

    /*
      KV is eventually consistent.
      Full transactional protection
      will later migrate to D1.
    */

    await store.put(
      id,
      JSON.stringify(lead)
    );

    await store.put(
      emailLookupKey,
      id
    );

    await sendEmail(
      context.env,
      lead,
      false
    );

    await sendTelegram(
      context.env,
`🚀 <b>NEW TVEVT ACCESS REQUEST</b>

ID: ${escapeHtml(id)}
Name: ${escapeHtml(name)}
Email: ${escapeHtml(email)}
Status: NEW

Client Key:
${escapeHtml(clientKey)}

Private Console:
${escapeHtml(consoleUrl)}`
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
          "Content-Type":
            "application/json"
        }
      }
    );

  } catch (err) {
    console.error(
      "Leads POST error:",
      err
    );

    return new Response(
      JSON.stringify({
        ok: false,
        error: err.message
      }),
      {
        status: 500,
        headers: {
          "Content-Type":
            "application/json"
        }
      }
    );
  }
}

export async function onRequestGet(context) {
  try {
    const url =
      new URL(context.request.url);

    const accessToken =
      url.searchParams.get("access");

    const store =
      context.env.STORE ||
      context.env.LOG_STORE;

    if (!store) {
      return new Response(
        JSON.stringify(
          accessToken
            ? { valid: false }
            : {
                ok: false,
                error:
                  "Storage not configured"
              }
        ),
        {
          status:
            accessToken ? 200 : 500,
          headers: {
            "Content-Type":
              "application/json"
          }
        }
      );
    }

    /*
      SECURITY:
      REQUIRE ADMIN AUTHORIZATION
      BEFORE LOADING KV
    */

    if (
      !accessToken &&
      !isAdminRequest(
        context.request,
        context.env,
        url
      )
    ) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Unauthorized"
        }),
        {
          status: 401,
          headers: {
            "Content-Type":
              "application/json"
          }
        }
      );
    }

    /*
      ONLY LOAD REQ- KEYS
    */

    const list =
      await store.list({
        prefix: "REQ-"
      });

    /*
      PARALLEL KV READS
    */

    const leadEntries =
      await Promise.all(
        list.keys.map(
          async (key) => {
            const raw =
              await store.get(
                key.name
              );

            if (!raw) {
              return null;
            }

            return {
              key: key.name,
              lead: JSON.parse(raw)
            };
          }
        )
      );

    const validEntries =
      leadEntries.filter(Boolean);

    /*
      ACCESS VALIDATION
    */

    if (accessToken) {
      for (const entry of validEntries) {
        const lead =
          entry.lead;

        if (
          lead.clientKey ===
          accessToken
        ) {
          return new Response(
            JSON.stringify({
              valid: true,
              id:
                lead.id ||
                entry.key,
              name:
                lead.name || "",
              email:
                lead.email || "",
              status:
                lead.status ||
                "NEW",
              consoleUrl:
                lead.consoleUrl ||
                ""
            }),
            {
              headers: {
                "Content-Type":
                  "application/json"
              }
            }
          );
        }
      }

      return new Response(
        JSON.stringify({
          valid: false
        }),
        {
          headers: {
            "Content-Type":
              "application/json"
          }
        }
      );
    }

    /*
      ADMIN LEAD LIST
    */

    const leads =
      validEntries.map(
        (entry) => {
          const lead =
            entry.lead;

          return {
            id:
              lead.id ||
              entry.key,
            name:
              lead.name || "—",
            email:
              lead.email || "—",
            status:
              lead.status ||
              "NEW",
            clientKey:
              lead.clientKey ||
              "",
            consoleUrl:
              lead.consoleUrl ||
              "",
            requestCount:
              lead.requestCount ||
              1,
            createdAt:
              lead.createdAt ||
              "",
            updatedAt:
              lead.updatedAt ||
              "",
            lastRequestAt:
              lead.lastRequestAt ||
              ""
          };
        }
      );

    leads.sort(
      (a, b) =>
        new Date(
          b.createdAt || 0
        ) -
        new Date(
          a.createdAt || 0
        )
    );

    return new Response(
      JSON.stringify({
        ok: true,
        leads
      }),
      {
        headers: {
          "Content-Type":
            "application/json"
        }
      }
    );

  } catch (err) {
    console.error(
      "Leads GET error:",
      err
    );

    return new Response(
      JSON.stringify({
        ok: false,
        error: err.message
      }),
      {
        status: 500,
        headers: {
          "Content-Type":
            "application/json"
        }
      }
    );
  }
}
