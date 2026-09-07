const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type"
};

const APP_URL = "https://raw.githubusercontent.com/offtamil3-max/MyGallery/main/index.html";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders
    }
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (url.pathname === "/" && request.method === "GET") {
      const app = await fetch(APP_URL, { cf: { cacheTtl: 60 } });
      if (!app.ok) return new Response("MyGallery app could not be loaded", { status: 502 });
      return new Response(app.body, {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "public, max-age=60"
        }
      });
    }

    if (url.pathname === "/api/health" && request.method === "GET") {
      return json({ ok: true, service: "MyGallery Telegram backend" });
    }

    if (url.pathname === "/api/upload" && request.method === "POST") {
      if (!env.BOT_TOKEN || !env.CHAT_ID) {
        return json({ ok: false, error: "Server secrets are not configured" }, 500);
      }

      try {
        const incoming = await request.formData();
        const file = incoming.get("file");
        const folder = String(incoming.get("folder") || "Other").trim().slice(0, 100);

        if (!(file instanceof File)) {
          return json({ ok: false, error: "file is required" }, 400);
        }

        if (file.size > 50 * 1024 * 1024) {
          return json({ ok: false, error: "File is larger than Telegram Bot API's 50 MB upload limit" }, 413);
        }

        const caption = `MyGallery | Folder: ${folder || "Other"}`;
        const body = new FormData();
        body.append("chat_id", env.CHAT_ID);
        body.append("document", file, file.name);
        body.append("caption", caption);

        const telegramResponse = await fetch(
          `https://api.telegram.org/bot${env.BOT_TOKEN}/sendDocument`,
          { method: "POST", body }
        );

        const result = await telegramResponse.json();

        if (!result.ok) {
          return json({
            ok: false,
            error: "Telegram upload failed",
            details: result.description || "Unknown Telegram error"
          }, 502);
        }

        return json({
          ok: true,
          message_id: result.result.message_id,
          folder: folder || "Other",
          filename: file.name,
          size: file.size
        });
      } catch (error) {
        return json({
          ok: false,
          error: "Upload request failed",
          details: error instanceof Error ? error.message : "Unknown error"
        }, 500);
      }
    }

    return json({ ok: false, error: "Not found" }, 404);
  }
};