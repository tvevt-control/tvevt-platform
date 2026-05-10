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

function canonicalPayload(record) {
  /*
    IMPORTANT:
    New records created by publish.js already store
    the exact canonicalPayload used for hashing.

    Verification must use that stored payload first.
    This prevents schema drift between publish.js
    and verify/[id].js.
  */
  if (record.canonicalPayload) {
    return record.canonicalPayload;
  }

  /*
    Fallback for older records created before
    canonicalPayload was stored.
  */
  const normalized = {
    text: record.text || record.content?.text || "",
    visibility: record.visibility || "public",
    createdAt: record.createdAt || record.timestamp || null
  };

  if (record.clientKey) {
    normalized.clientKey = record.clientKey;
  }

  return JSON.stringify(normalized);
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

export async function onRequestGet(context) {
  try {
    const { id } = context.params;

    if (!id) {
      return jsonResponse(
        {
          ok: false,
          error: "Missing record id"
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
          error: "Storage not configured"
        },
        500
      );
    }

    const raw = await store.get(id);

    if (!raw) {
      return jsonResponse(
        {
          ok: false,
          error: "Record not found"
        },
        404
      );
    }

    const record = JSON.parse(raw);

    const payload = canonicalPayload(record);

    const recalculatedHash = await sha256(payload);

    const storedHash = record.hash || "";

    const verified =
      Boolean(storedHash) &&
      recalculatedHash === storedHash;

    const verification = {
      verified,
      recalculatedHash,
      storedHash,
      canonicalPayload: payload
    };

    return jsonResponse({
      ok: true,

      verified,

      verification,

      record: {
        id: record.id || id,

        type: record.type || "Verified Signal",

        visibility: record.visibility || "public",

        status: record.status || "sealed",

        anchor_status:
          record.anchor_status ||
          record.status ||
          "sealed",

        text:
          record.text ||
          record.content?.text ||
          "",

        content: {
          text:
            record.text ||
            record.content?.text ||
            ""
        },

        hash: storedHash,

        createdAt:
          record.createdAt ||
          record.timestamp ||
          "",

        timestamp:
          record.timestamp ||
          record.createdAt ||
          "",

        verification_url:
          record.verification_url ||
          record.recordUrl ||
          `https://tvevt.com/record.html?id=${encodeURIComponent(record.id || id)}`,

        recordUrl:
          record.recordUrl ||
          record.verification_url ||
          `https://tvevt.com/record.html?id=${encodeURIComponent(record.id || id)}`,

        owner:
          record.visibility === "private"
            ? {
                name: record.owner?.name || "",
                email: record.owner?.email || ""
              }
            : null,

        lifecycle:
          record.lifecycle ||
          []
      }
    });

  } catch (err) {
    console.error(
      "Verify record error:",
      err
    );

    return jsonResponse(
      {
        ok: false,
        error: err.message
      },
      500
    );
  }
}
