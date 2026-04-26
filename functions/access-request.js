export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { name, email } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: "Email required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const id = "REQ-" + Math.random().toString(36).substring(2, 10).toUpperCase();

    const record = {
      id,
      name: name || "",
      email,
      status: "NEW",
      createdAt: new Date().toISOString()
    };

    if (context.env.STORE) {
      await context.env.STORE.put(id, JSON.stringify(record));
    }

    if (context.env.TG_TOKEN && context.env.TG_CHAT_ID) {
      const origin = new URL(context.request.url).origin;

      const text =
`🚀 NEW TVEVT ACCESS REQUEST

ID: ${id}
Name: ${name || "—"}
Email: ${email}
Status: NEW
Time: ${record.createdAt}`;

      await fetch(`https://api.telegram.org/bot${context.env.TG_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: context.env.TG_CHAT_ID,
          text,
          reply_markup: {
            inline_keyboard: [
              [
                { text: "✅ Approve", url: `${origin}/lead-action?id=${id}&status=APPROVED` },
                { text: "❌ Reject", url: `${origin}/lead-action?id=${id}&status=REJECTED` }
              ]
            ]
          }
        })
      });
    }

    return new Response(JSON.stringify({ success: true, id }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
