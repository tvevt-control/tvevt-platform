export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);

    const id = url.searchParams.get("id");
    const action = url.searchParams.get("action");

    if (!id || !action) {
      return new Response("Missing parameters", { status: 400 });
    }

    const store = context.env.LOG_STORE;

    const raw = await store.get(id);
    if (!raw) {
      return new Response("Request not found", { status: 404 });
    }

    const lead = JSON.parse(raw);

    // 🔥 если approve → создаём ключ
    if (action === "approve") {
      const clientKey = "TVEVT-" + Math.random().toString(36).substring(2, 8).toUpperCase();

      lead.status = "APPROVED";
      lead.clientKey = clientKey;
      lead.consoleUrl = `/console.html?key=${clientKey}`;
    }

    if (action === "reject") {
      lead.status = "REJECTED";
    }

    await store.put(id, JSON.stringify(lead));

    return new Response(`
      <html>
        <body style="font-family:Arial;padding:40px;background:#0b0b0c;color:white">
          <h2>TVEVT Access ${lead.status}</h2>

          ${lead.clientKey ? `
            <p>Client Key:</p>
            <code>${lead.clientKey}</code>

            <p>Console:</p>
            <a href="${lead.consoleUrl}" style="color:#ff9b3d">
              ${lead.consoleUrl}
            </a>
          ` : ""}

        </body>
      </html>
    `, {
      headers: { "Content-Type": "text/html" }
    });

  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
}
