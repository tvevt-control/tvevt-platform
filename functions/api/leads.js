export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();

    const name = body.name || "User";
    const email = body.email;

    if (!email) {
      return new Response(JSON.stringify({ error: "Email required" }), {
        status: 400,
      });
    }

    // 🔑 Генерация client key
    const clientKey =
      "CLIENT-" + Math.random().toString(36).substring(2, 10).toUpperCase();

    const consoleLink = `https://tvevt.com/console.html?key=${clientKey}`;

    // 📩 EMAIL через Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TVEVT <access@tvevt.com>",
        to: [email],
        bcc: ["max@fincib.com"],
        subject: "Your access to TVEVT is ready",
        html: `
          <div style="font-family: Arial, sans-serif; padding:20px;">
            <h2 style="color:#111;">Hi ${name},</h2>

            <p style="font-size:16px;">
              Your access to <strong>TVEVT</strong> is ready.
            </p>

            <p style="font-size:16px;">
              Open your private console:
            </p>

            <p>
              <a href="${consoleLink}"
                style="background:#ff8a00;color:#fff;padding:12px 18px;text-decoration:none;border-radius:6px;font-weight:bold;">
                Enter TVEVT →
              </a>
            </p>

            <p style="font-size:14px;color:#888;margin-top:20px;">
              If you did not request this, you can ignore this email.
            </p>

            <p style="font-size:14px;margin-top:20px;">
              — TVEVT
            </p>
          </div>
        `,
      }),
    });

    const resendData = await resendResponse.json();

    // 📩 Telegram уведомление (оставляем как есть)
    if (env.TG_TOKEN && env.TG_CHAT_ID) {
      await fetch(`https://api.telegram.org/bot${env.TG_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: env.TG_CHAT_ID,
          text: `🚀 NEW TVEVT ACCESS REQUEST

ID: ${clientKey}
Name: ${name}
Email: ${email}

Private console:
${consoleLink}`,
        }),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        clientKey,
        resend: resendData,
      }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
