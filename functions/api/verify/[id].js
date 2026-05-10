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

function buildCanonicalPayload(record) {
  if (record.canonicalPayload) {
    return record.canonicalPayload;
  }

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

function buildVerificationCandidates(record) {
  const text = record.text || record.content?.text || "";

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

  if (record.content?.text && record.content.text !== text) {
    candidates.push({
      mode: "legacy_content_text_only",
      payload: record.content.text
    });
  }

  return candidates;
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

    const storedHash = record.hash || "";

    const candidates = buildVerificationCandidates(record);

    let verified = false;
    let matchedMode = "";
    let matchedPayload = "";
    let recalculatedHash = "";

    for (const candidate of candidates) {
      const candidateHash = await sha256(candidate.payload);

      if (candidateHash === storedHash) {
        verified = true;
        matchedMode = candidate.mode;
        matchedPayload = candidate.payload;
        recalculatedHash = candidateHash;
        break;
      }

      if (!recalculatedHash) {
        recalculatedHash = candidateHash;
      }
    }

    const text =
      record.text ||
      record.content?.text ||
      "";

    const recordUrl =
      record.recordUrl ||
      record.verification_url ||
      `https://tvevt.com/record.html?id=${encodeURIComponent(record.id || id)}`;

    return jsonResponse({
      ok: true,

      verified,

      verification: {
        verified,
        mode: matchedMode || "no_hash_match",
        recalculatedHash,
        storedHash,
        canonicalPayload: matchedPayload || buildCanonicalPayload(record)
      },

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

        hash: storedHash,

        createdAt:
          record.createdAt ||
          record.timestamp ||
          "",

        timestamp:
          record.timestamp ||
          record.createdAt ||
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
