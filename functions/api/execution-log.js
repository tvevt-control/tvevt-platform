function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

function normalizeLog(record, keyName = "") {
  return {
    id: record.id || keyName || "—",
    signalId: record.signalId || "",
    event: record.event || "SIGNAL_EVENT",
    timestamp: record.timestamp || record.createdAt || "",
    hash: record.hash || "",
    status: record.status || "recorded",
    text: record.text || "",
    visibility: record.visibility || "private"
  };
}

async function getLeadByClientKey(store, clientKey) {
  if (!clientKey) return null;

  const list = await store.list({ prefix: "REQ-" });

  const entries = await Promise.all(
    list.keys.map(async (item) => {
      const raw = await store.get(item.name);

      if (!raw) return null;

      try {
        const lead = JSON.parse(raw);

        if (
          lead.clientKey === clientKey &&
          lead.status !== "BLOCKED" &&
          !lead.hidden
        ) {
          return lead;
        }

        return null;
      } catch {
        return null;
      }
    })
  );

  return entries.find(Boolean) || null;
}

export async function onRequestGet(context) {
  try {
    const store = context.env.STORE || context.env.LOG_STORE;

    if (!store) {
      return json(
        { error: "Storage not configured" },
        500
      );
    }

    const url = new URL(context.request.url);

    const key = (url.searchParams.get("key") || "").trim();

    const query = (
      url.searchParams.get("q") || ""
    )
      .trim()
      .toLowerCase();

    if (!key) {
      return json(
        { error: "Missing key" },
        403
      );
    }

    /*
      ADMIN ACCESS
      Use environment variable in production:
      context.env.ADMIN_KEY
    */
    const adminKey =
      context.env.ADMIN_KEY || "TVEVT-MAX-2026";

    const isAdmin = key === adminKey;

    if (!isAdmin) {
      const lead = await getLeadByClientKey(
        store,
        key
      );

      if (!lead) {
        return json(
          {
            error:
              "Invalid, blocked, or inactive key"
          },
          403
        );
      }
    }

    const list = await store.list({
      prefix: "LOG-"
    });

    const entries = await Promise.all(
      list.keys.map(async (item) => {
        const raw = await store.get(item.name);

        if (!raw) return null;

        try {
          const parsed = JSON.parse(raw);

          /*
            Non-admin users only see
            their own execution events
          */
          if (!isAdmin) {
            if (parsed.clientKey !== key) {
              return null;
            }
          }

          const normalized = normalizeLog(
            parsed,
            item.name
          );

          if (query) {
            const haystack = [
              normalized.id,
              normalized.signalId,
              normalized.event,
              normalized.timestamp,
              normalized.hash,
              normalized.status,
              normalized.text,
              normalized.visibility
            ]
              .join(" ")
              .toLowerCase();

            if (!haystack.includes(query)) {
              return null;
            }
          }

          return normalized;

        } catch {
          return null;
        }
      })
    );

    const logs = entries
      .filter(Boolean)
      .sort(
        (a, b) =>
          new Date(b.timestamp || 0) -
          new Date(a.timestamp || 0)
      );

    return json({
      ok: true,
      count: logs.length,
      logs
    });

  } catch (err) {
    console.error(
      "Execution Log API Error:",
      err
    );

    return json(
      {
        error:
          err.message ||
          "Internal server error"
      },
      500
    );
  }
}
