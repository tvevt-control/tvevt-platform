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

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

function getText(record) {
  return (
    record.text ||
    record.content?.text ||
    record.statement ||
    record.payload?.text ||
    ""
  );
}

function buildCanonicalPayload(record) {
  if (record.canonicalPayload) {
    return record.canonicalPayload;
  }

  const normalized = {
    text: getText(record),
    visibility: record.visibility || "public",
    createdAt: record.createdAt || record.timestamp || null
  };

  if (record.clientKey) {
    normalized.clientKey = record.clientKey;
  }

  return JSON.stringify(normalized);
}

function buildVerificationCandidates(record) {
  const text = getText(record);

  const candidates = [];

  if (record.canonicalPayload) {
    candidates.push({
      mode: "stored_canonical_payload",
      payload: record.canonicalPayload
    });
  }

  candidates.push({
    mode: "current_canonical_payload",
    payload: buildCanonicalPayload(record)
  });

  candidates.push({
    mode: "legacy_text_only",
    payload: text
  });

  candidates.push({
    mode: "legacy_content_text_only",
    payload: record.content?.text || ""
  });

  candidates.push({
    mode: "legacy_record_json",
    payload: JSON.stringify(record)
  });

  candidates.push({
    mode: "legacy_content_json",
    payload: JSON.stringify(record.content || {})
  });

  candidates.push({
    mode: "legacy_text_timestamp",
    payload: JSON.stringify({
      text,
      timestamp: record.timestamp || record.createdAt || ""
    })
  });

  candidates.push({
    mode: "legacy_text_createdAt",
    payload: JSON.stringify({
      text,
      createdAt: record.createdAt || record.timestamp || ""
    })
  });

  candidates.push({
    mode: "legacy_id_key_text_time",
    payload: JSON.stringify({
      id: record.id || "",
      key: record.clientKey || record.key || "",
      text,
      time: record.time || record.timestamp || record.createdAt || ""
    })
  });

  return candidates.filter(
    (candidate) =>
      typeof candidate.payload === "string" &&
      candidate.payload.length > 0
  );
}

async function verifyHash(record) {
  const storedHash = record.hash || "";

  const candidates = buildVerificationCandidates(record);

  let firstHash = "";

  for (const candidate of candidates) {
    const hash = await sha256(candidate.payload);

    if (!firstHash) {
      firstHash = hash;
    }

    if (hash === storedHash) {
      return {
        verified: true,
        mode: candidate.mode,
        recalculatedHash: hash,
        storedHash,
        canonicalPayload: candidate.payload
      };
    }
  }

  return {
    verified: false,
    mode: "no_hash_match",
    recalculatedHash: firstHash,
    storedHash,
    canonicalPayload: buildCanonicalPayload(record)
  };
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

    const verification = await verifyHash(record);

    const text = getText(record);

    const recordUrl =
      record.recordUrl ||
      record.verification_url ||
      `https://tvevt.com/record.html?id=${encodeURIComponent(record.id || id)}`;

    return jsonResponse({
      ok: true,

      verified: verification.verified,

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

        text,

        content: {
          text
        },

        hash: record.hash || "",

        createdAt:
          record.createdAt ||
          record.timestamp ||
          record.time ||
          "",

        timestamp:
          record.timestamp ||
          record.createdAt ||
          record.time ||
          "",

        verification_url: recordUrl,

        recordUrl,

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
    console.error("Verify record error:", err);

    return jsonResponse(
      {
        ok: false,
        error: err.message
      },
      500
    );
  }
}
