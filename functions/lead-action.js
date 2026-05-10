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

function jsonResponse(payload, status = 200) {
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

export async function onRequestPost(context) {
  try {
    const url =
      new URL(context.request.url);

    /*
      REQUIRE ADMIN AUTHORIZATION
    */

    if (
      !isAdminRequest(
        context.request,
        context.env,
        url
      )
    ) {
      return jsonResponse(
        {
          ok: false,
          error: "Unauthorized"
        },
        401
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

    const data =
      await context.request.json();

    const id = String(data.id || "")
      .trim();

    const action = String(
      data.action || ""
    )
      .trim()
      .toLowerCase();

    /*
      VALIDATE INPUT
    */

    if (!id || !action) {
      return jsonResponse(
        {
          ok: false,
          error:
            "Missing id or action"
        },
        400
      );
    }

    /*
      SECURITY:
      ONLY REQ-* OBJECTS
    */

    if (!id.startsWith("REQ-")) {
      return jsonResponse(
        {
          ok: false,
          error:
            "Invalid lead id"
        },
        400
      );
    }

    const raw =
      await store.get(id);

    if (!raw) {
      return jsonResponse(
        {
          ok: false,
          error: "Lead not found"
        },
        404
      );
    }

    const lead =
      JSON.parse(raw);

    const now =
      new Date().toISOString();

    /*
      REVIEW
    */

    if (action === "review") {
      lead.status =
        "REVIEWED";

      lead.reviewedAt =
        now;
    }

    /*
      APPROVE
    */

    else if (
      action === "approve"
    ) {
      lead.status =
        "APPROVED";

      if (!lead.clientKey) {
        lead.clientKey =
          generateId(
            "CLIENT"
          );
      }

      lead.consoleUrl =
        `https://tvevt.com/console.html?key=${lead.clientKey}`;

      lead.approvedAt =
        now;
    }

    /*
      RESEND
    */

    else if (
      action === "resend"
    ) {
      lead.status =
        "RESENT";

      lead.lastRequestAt =
        now;

      lead.requestCount =
        (lead.requestCount || 1) + 1;
    }

    /*
      BLOCK
    */

    else if (
      action === "block"
    ) {
      lead.status =
        "BLOCKED";

      lead.blockedAt =
        now;
    }

    /*
      HIDE
    */

    else if (
      action === "hide"
    ) {
      lead.hidden = true;

      lead.hiddenAt =
        now;

      if (
        lead.status !==
        "BLOCKED"
      ) {
        lead.status =
          "HIDDEN";
      }
    }

    /*
      DELETE
    */

    else if (
      action === "delete"
    ) {
      /*
        DELETE EMAIL INDEX
      */

      if (lead.email) {
        const emailLookupKey =
          makeEmailLookupKey(
            lead.email
          );

        await store.delete(
          emailLookupKey
        );
      }

      /*
        DELETE LEAD
      */

      await store.delete(id);

      return jsonResponse({
        ok: true,
        deleted: true,
        id
      });
    }

    /*
      UNKNOWN ACTION
    */

    else {
      return jsonResponse(
        {
          ok: false,
          error:
            "Unsupported action"
        },
        400
      );
    }

    /*
      UPDATE TIMESTAMP
    */

    lead.updatedAt =
      now;

    /*
      SAVE
    */

    await store.put(
      id,
      JSON.stringify(lead)
    );

    return jsonResponse({
      ok: true,
      id,
      action,
      lead
    });

  } catch (err) {
    console.error(
      "Lead action error:",
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

export async function onRequestGet() {
  return jsonResponse(
    {
      ok: false,
      error:
        "Use POST for lead actions"
    },
    405
  );
}
