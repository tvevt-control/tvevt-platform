function randomId(prefix = "TVE") {
  return prefix + "-" + Math.random().toString(36).substring(2, 8).toUpperCase();
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

function json(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    }
  );
}

export async function onRequestGet() {
  return json({
    ok: true,
    endpoint: "/api/publish",
    method: "POST"
  });
}

export async function onRequestPost(context) {
  try {
    const store =
      context.env.STORE ||
      context.env.LOG_STORE;

    if (!store) {
      return json(
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

    if (!text) {
      return json(
        {
          ok: false,
          error: "Missing signal text"
        },
        400
      );
    }

    const id = randomId("TVE");
    const logId = randomId("LOG");

    const createdAt = new Date().toISOString();

    const verification_url =
      `https://tvevt.com/record.html?id=${id}`;

    /*
      IMPORTANT:
      Keep this payload stable.
      verify/[id].js already supports this format.
    */
    const payload = JSON.stringify({
      text,
      createdAt
    });

    const hash = await sha256(payload);

    const visibility = clientKey ? "private" : "public";

    const record = {
      id,

      type: "verified_signal",

      status: "verified",

      anchor_status: "sealed",

      visibility,

      clientKey: clientKey || null,

      key: clientKey || "",

      text,

      content: {
        text
      },

      hash,

      createdAt,

      timestamp: createdAt,

      verification_url,

      recordUrl: verification_url,

      lifecycle: [
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
      ]
    };

    const executionEvent = {
      id: logId,

      type: "execution_log",

      event: "signal_sealed",

      text: "Signal sealed and verified record created.",

      signalId: id,

      recordId: id,

      clientKey: clientKey || null,

      key: clientKey || "",

      visibility,

      status: "recorded",

      hash,

      createdAt,

      timestamp: createdAt,

      time: createdAt,

      verification_url,

      recordUrl: verification_url
    };

    await Promise.all([
      store.put(
        id,
        JSON.stringify(record)
      ),

      store.put(
        logId,
        JSON.stringify(executionEvent)
      )
    ]);

    return json({
      ok: true,

      id,

      logId,

      hash,

      verification_url,

      recordUrl: verification_url,

      record,

      executionEvent
    });

  } catch (err) {
    console.error(err);

    return json(
      {
        ok: false,
        error: err.message
      },
      500
    );
  }
}
