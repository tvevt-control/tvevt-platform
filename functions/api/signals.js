function isAdminRequest(request, env, url) {
  const tokenFromQuery = url.searchParams.get("admin_token");
  const tokenFromHeader = request.headers.get("x-admin-token");
  const authHeader = request.headers.get("authorization") || "";

  const tokenFromBearer = authHeader.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "").trim()
    : "";

  const adminToken = env.ADMIN_TOKEN;

  if (!adminToken) return false;

  return (
    tokenFromQuery === adminToken ||
    tokenFromHeader === adminToken ||
    tokenFromBearer === adminToken
  );
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

function normalizeRecord(record, fallbackId) {
  const id = record.id || fallbackId;

  return {
    id,
    type: record.type || "Verified Signal",
    visibility: record.visibility || "public",
    timestamp: record.timestamp || record.createdAt || "",
    createdAt: record.createdAt || record.timestamp || "",
    hash: record.hash || "",
    status: record.anchor_status || record.status || "sealed",
    anchor_status: record.anchor_status || record.status || "sealed",
    text: record.content?.text || record.text || "",
    recordUrl:
      record.recordUrl ||
      record.verification_url ||
      `/record.html?id=${encodeURIComponent(id)}`,
    verification_url:
      record.verification_url ||
      record.recordUrl ||
      `/record.html?id=${encodeURIComponent(id)}`
  };
}

export async function onRequestGet(context) {
  try {
    const store = context.env.STORE || context.env.LOG_STORE;

    if (!store) {
      return jsonResponse(
        {
          ok: false,
          error: "Storage not configured"
        },
        500
      );
    }

    const url = new URL(context.request.url);

    const key = String(url.searchParams.get("key") || "").trim();

    const query = String(url.searchParams.get("q") || "")
      .toLowerCase()
      .trim();

    const admin = isAdminRequest(context.request, context.env, url);

    if (!key && !admin) {
      return jsonResponse(
        {
          ok: false,
          error: "Missing private access key"
        },
        403
      );
    }

    const list = await store.list({
      prefix: "TVE-"
    });

    const entries = await Promise.all(
      list.keys.map(async (item) => {
        const raw = await store.get(item.name);

        if (!raw) return null;

        try {
          return {
            key: item.name,
            record: JSON.parse(raw)
          };
        } catch {
          return null;
        }
      })
    );

    const signals = [];

    for (const entry of entries.filter(Boolean)) {
      const record = entry.record;

      if (!admin) {
        const recordClientKey = record.clientKey || record.key || "";

        if (recordClientKey !== key) {
          continue;
        }
      }

      const signal = normalizeRecord(record, entry.key);

      if (query) {
        const haystack = [
          signal.id,
          signal.timestamp,
          signal.status,
          signal.hash,
          signal.text,
          signal.visibility
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(query)) {
          continue;
        }
      }

      signals.push(signal);
    }

    signals.sort(
      (a, b) =>
        new Date(b.timestamp || 0) -
        new Date(a.timestamp || 0)
    );

    return jsonResponse({
      ok: true,
      signals,
      records: signals
    });

  } catch (err) {
    console.error("Signals GET error:", err);

    return jsonResponse(
      {
        ok: false,
        error: err.message
      },
      500
    );
  }
}
