function randomId() {
  return "TVE-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function sha256(text) {

  const data =
    new TextEncoder().encode(text);

  const hashBuffer =
    await crypto.subtle.digest(
      "SHA-256",
      data
    );

  return Array.from(
    new Uint8Array(hashBuffer)
  )
    .map((b) =>
      b.toString(16).padStart(2, "0")
    )
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

    const body =
      await context.request.json();

    const text =
      (body.text || "")
        .trim();

    if (!text) {

      return json(
        {
          ok: false,
          error: "Missing signal text"
        },
        400
      );
    }

    const id =
      randomId();

    const createdAt =
      new Date().toISOString();

    const verification_url =
      `https://tvevt.com/record.html?id=${id}`;

    const payload =
      JSON.stringify({
        text,
        createdAt
      });

    const hash =
      await sha256(payload);

    const record = {

      id,

      type: "verified_signal",

      status: "verified",

      visibility: "public",

      text,

      hash,

      createdAt,

      verification_url,

      recordUrl:
        verification_url,

      lifecycle: []
    };

    await store.put(
      id,
      JSON.stringify(record)
    );

    return json({

      ok: true,

      id,

      hash,

      verification_url,

      recordUrl:
        verification_url,

      record
    });

  }

  catch(err){

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
