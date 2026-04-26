export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const id = url.searchParams.get("id");
    const status = url.searchParams.get("status");

    if (!id || !status) {
      return new Response("Missing request data", { status: 400 });
    }

    const allowed = ["APPROVED", "REJECTED"];
    if (!allowed.includes(status)) {
      return new Response("Invalid status", { status: 400 });
    }

    let record = { id };

    if (context.env.STORE) {
      const existing = await context.env.STORE.get(id);
      record = existing ? JSON.parse(existing) : { id };
      record.status = status;
      record.updatedAt = new Date().toISOString();

      await context.env.STORE.put(id, JSON.stringify(record));
    }

    if (
      context.env.TG_TOKEN &&
      context.env.TG_CHAT_ID &&
      record.telegramMessageId
    ) {
      const icon = status === "APPROVED" ? "✅" : "❌";

      const text =
`🚀 TVEVT ACCESS REQUEST

ID: ${record.id}
Name: ${record.name || "—"}
Email: ${record.email || "—"}
Status: ${status} ${icon}
Created: ${record.createdAt || "—"}
Updated: ${record.updatedAt}`;

      await fetch(`https://api.telegram.org/bot${context.env.TG_TOKEN}/editMessageText`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: context.env.TG_CHAT_ID,
          message_id: record.telegramMessageId,
          text
        })
      });
    }

    return new Response(
      `<!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>TVEVT Lead Updated</title>
        <style>
          body{
            margin:0;
            min-height:100vh;
            display:flex;
            align-items:center;
            justify-content:center;
            background:#07090c;
            color:#f4f6f8;
            font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;
          }
          .card{
            max-width:520px;
            padding:36px;
            border:1px solid rgba(255,255,255,.12);
            border-radius:28px;
            background:rgba(255,255,255,.04);
          }
          h1{margin:0 0 12px;font-size:34px}
          p{color:rgba(244,246,248,.65);line-height:1.5}
          strong{color:#ffb14a}
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Lead ${status.toLowerCase()}.</h1>
          <p>Request <strong>${id}</strong> has been marked as <strong>${status}</strong>.</p>
        </div>
      </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } }
    );

  } catch (err) {
    return new Response("Error: " + err.message, { status: 500 });
  }
}
