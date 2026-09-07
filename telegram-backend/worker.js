// MyGallery Telegram storage backend
// Deploy as a serverless Worker. Keep BOT_TOKEN in the platform secret store.

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json", "access-control-allow-origin": "*" }
});

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, {
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST,OPTIONS",
        "access-control-allow-headers": "content-type"
      }
    });

    const url = new URL(request.url);
    if (url.pathname === "/api/health") return json({ ok: true, service: "MyGallery Telegram backend" });

    if (url.pathname === "/api/upload" && request.method === "POST") {
      if (!env.BOT_TOKEN || !env.CHAT_ID) return json({ error: "Server secrets are not configured" }, 500);
      const incoming = await request.formData();
      const file = incoming.get("file");
      const folder = String(incoming.get("folder") || "Other");
      if (!(file instanceof File)) return json({ error: "file is required" }, 400);

      // Telegram receives the original file. Folder is stored in the caption;
      // a database can be added later for richer metadata and move/rename support.
      const caption = `MyGallery | Folder: ${folder}`;
      const body = new FormData();
      body.append("chat_id", env.CHAT_ID);
      body.append("document", file, file.name);
      body.append("caption", caption);

      const tg = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendDocument`, {
        method: "POST",
        body
      });
      const result = await tg.json();
      if (!result.ok) return json({ error: "Telegram upload failed", details: result.description || "unknown" }, 502);
      return json({ ok: true, message_id: result.result.message_id, folder });
    }

    return json({ error: "Not found" }, 404);
  }
};
