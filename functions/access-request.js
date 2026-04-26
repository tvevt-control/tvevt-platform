export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    const { name, email } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email required" }),
        { status: 400 }
      );
    }

    const id = "REQ-" + Math.random().toString(36).substring(2, 10).toUpperCase();

    const record = {
      id,
      name: name || "",
      email,
      createdAt: new Date().toISOString()
    };

    // сохраняем в KV (если подключен)
    if (context.env.LOG_STORE) {
      await context.env.LOG_STORE.put(id, JSON.stringify(record));
    }

    return new Response(
      JSON.stringify({
        success: true,
        id
      }),
      {
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Invalid request" }),
      { status: 400 }
    );
  }
}
