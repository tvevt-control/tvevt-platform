async function sha256(text) {

  const data =
    new TextEncoder()
      .encode(text);

  const hashBuffer =
    await crypto.subtle.digest(
      "SHA-256",
      data
    );

  return Array.from(
    new Uint8Array(hashBuffer)
  )
    .map((b) =>
      b
        .toString(16)
        .padStart(2, "0")
    )
    .join("");
}

function canonicalPayload(record) {

  const normalized = {
    text:
      record.text || "",

    visibility:
      record.visibility ||
      "public",

    createdAt:
      record.createdAt ||
      record.timestamp ||
      null
  };

  if (record.clientKey) {

    normalized.clientKey =
      record.clientKey;
  }

  return JSON.stringify(normalized);
}

function jsonResponse(
  payload,
  status = 200
) {

  return new Response(
    JSON.stringify(payload),
    {
      status,
      headers: {
        "Content-Type":
          "application/json"
      }
    }
  );
}

export async function onRequestGet(
  context
) {

  try {

    const { id } =
      context.params;

    if (!id) {

      return jsonResponse(
        {
          ok: false,
          error:
            "Missing record id"
        },
        400
      );
    }

    const store =
      context.env.STORE ||
      context.env.LOG_STORE;

    if (!store) {

      return jsonResponse(
        {
          ok: false,
          error:
            "Storage not configured"
        },
        500
      );
    }

    const raw =
      await store.get(id);

    if (!raw) {

      return jsonResponse(
        {
          ok: false,
          error:
            "Record not found"
        },
        404
      );
    }

    const record =
      JSON.parse(raw);

    const payload =
      canonicalPayload(
        record
      );

    const recalculatedHash =
      await sha256(payload);

    const verified =
      recalculatedHash ===
      record.hash;

    const verification = {

      verified,

      recalculatedHash,

      storedHash:
        record.hash,

      canonicalPayload:
        payload
    };

    return jsonResponse({

      ok: true,

      verification,

      record: {

        id:
          record.id,

        type:
          record.type,

        visibility:
          record.visibility,

        status:
          record.status,

        anchor_status:
          record.anchor_status,

        text:
          record.text,

        hash:
          record.hash,

        createdAt:
          record.createdAt,

        timestamp:
          record.timestamp,

        verification_url:
          record.verification_url,

        recordUrl:
          record.recordUrl,

        owner:
          record.visibility ===
          "private"

            ? {
                name:
                  record.owner
                    ?.name || "",

                email:
                  record.owner
                    ?.email || ""
              }

            : null,

        lifecycle:
          record.lifecycle ||
          []
      }
    });

  }

  catch(err){

    console.error(
      "Verify record error:",
      err
    );

    return jsonResponse(
      {
        ok: false,
        error:
          err.message
      },
      500
    );
  }
}
