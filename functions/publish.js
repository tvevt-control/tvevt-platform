function generateRecordId() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));

  const randomPart = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

  return `TVE-${randomPart}`;
}

function generateLogId() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));

  const randomPart = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

  return `LOG-${randomPart}`;
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);

  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    data
  );

  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function canonicalPayload({
  text,
  clientKey,
  visibility,
  createdAt
}) {
  const normalized = {
    text,
    visibility,
    createdAt
  };

  if (clientKey) {
    normalized.clientKey = clientKey;
  }

  return JSON.stringify(normalized);
}

async function getLeadByClientKey(store, clientKey) {
  if (!clientKey) return null;

  const keyIndex = `key:${clientKey}`;
  const indexedLeadId = await store.get(keyIndex);

  if (indexedLeadId) {
    const raw = await store.get(indexedLeadId);

    if (!raw) return null;

    return JSON.parse(raw);
  }

  const list = await store.list({
    prefix: "REQ-"
  });

  const entries = await Promise.all(
    list.keys.map(async (key) => {
      const raw = await store.get(key.name);

      if (!raw) return null;

      const lead = JSON.parse(raw);

      if (lead.clientKey === clientKey) {
        await store.put(keyIndex, lead.id);

        return lead;
      }

      return null;
    })
  );

  return entries.find(Boolean) || null;
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

export async function onRequestPost(context) {
  try {
    const store =
      context.env.STORE ||
      context.env.LOG_STORE;

    if (!store) {
      return jsonResponse(
        {
          ok: false,
          error: "Storage not configured"
        },
        500
      );
    }

    const body = await context.request.json();

    const text = String(body.text || "").trim();

    const clientKey = String(
      body.key ||
      body.clientKey ||
      ""
    ).trim();

    const visibility = clientKey ? "private" : "public";

    if (!text) {
      return jsonResponse(
        {
          ok: false,
          error: "Missing text"
        },
        400
      );
    }

    let lead = null;

    if (clientKey) {
      lead = await getLeadByClientKey(
        store,
        clientKey
      );

      if (!lead) {
        return jsonResponse(
          {
            ok: false,
            error: "Invalid private access key"
          },
          401
        );
      }

      if (lead.status === "BLOCKED" || lead.hidden) {
        return jsonResponse(
          {
            ok: false,
            error: "Private access is blocked"
          },
          403
        );
      }
    }

    const id = generateRecordId();
    const logId = generateLogId();
    const createdAt = new Date().toISOString();

    const payload = canonicalPayload({
      text,
      clientKey: clientKey || null,
      visibility,
      createdAt
    });

    const hash = await sha256(payload);

    const verificationUrl =
      `https://tvevt.com/record.html?id=${id}`;

    const lifecycle = [
      {
        status: "created",
        at: createdAt
      },
      {
        status: "sealed",
        at: createdAt
      },
      {
        status: "execution_logged",
        at: createdAt
      }
    ];

    const owner = lead
      ? {
          name: lead.name || "",
          email: lead.email || ""
        }
      : null;

    const record = {
      id,
      type: "Verified Signal",

      visibility,

      status: "sealed",
      anchor_status: "sealed",

      clientKey: clientKey || null,
      leadId: lead?.id || null,
      owner,

      text,

      content: {
        text
      },

      canonicalPayload: payload,

      hash,

      createdAt,
      timestamp: createdAt,

      verification_url: verificationUrl,
      recordUrl: verificationUrl,

      lifecycle
    };

    const executionEvent = {
      id: logId,

      signalId: id,

      event: "SIGNAL_SEALED",

      timestamp: createdAt,
      createdAt,

      hash,

      status: "recorded",

      visibility,

      clientKey: clientKey || null,
      leadId: lead?.id || null,
      owner,

      text: "Signal sealed and verified record created.",

      recordUrl: verificationUrl,
      verification_url: verificationUrl
    };

    await Promise.all([
      store.put(id, JSON.stringify(record)),
      store.put(logId, JSON.stringify(executionEvent))
    ]);

    return jsonResponse({
      ok: true,

      id,
      logId,

      hash,

      verification_url: verificationUrl,
      recordUrl: verificationUrl,

      record,
      executionEvent
    });

  } catch (err) {
    console.error("Publish error:", err);

    return jsonResponse(
      {
        ok: false,
        error: err.message
      },
      500
    );
  }
}
