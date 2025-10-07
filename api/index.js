import express from "express";
import xml2js from "xml2js";
import cors from "cors";
import https from "https";

const app = express();
app.use(cors());

app.get("/api/hiru-news", async (req, res) => {
  const feedUrl = "https://www.hirunews.lk/rss";

  try {
    https.get(
      feedUrl,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36",
          Accept: "application/xml,text/xml;q=0.9,*/*;q=0.8"
        }
      },
      (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          if (!data) {
            return res
              .status(500)
              .json({ error: "No data received from Hiru News" });
          }

          // 🧹 Clean broken HTML tags to avoid parse errors
          const cleanedXml = data
            .replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, "&amp;")
            .replace(/<\/?br ?\/?>/g, "")
            .replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?<\/style>/gi, "");

          const parser = new xml2js.Parser({
            explicitArray: false,
            ignoreAttrs: true,
            trim: true,
            strict: false // 💪 Ignore invalid closing tags
          });

          parser.parseString(cleanedXml, (err, result) => {
            if (err) {
              console.error("XML parse error:", err);
              return res.status(500).json({ error: err.message });
            }

            try {
              const items = result?.rss?.channel?.item;
              if (!items) {
                return res
                  .status(500)
                  .json({ error: "No news items found in feed" });
              }

              const articles = Array.isArray(items) ? items : [items];

              const news = articles.map((item) => ({
                title: item.title,
                link: item.link,
                published: item.pubDate,
                summary: item.description
              }));

              res.json(news);
            } catch (e) {
              console.error("Processing error:", e);
              res
                .status(500)
                .json({ error: "Error processing Hiru News articles" });
            }
          });
        });
      }
    ).on("error", (err) => {
      console.error("HTTPS request error:", err);
      res.status(500).json({ error: "Failed to fetch RSS feed" });
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default app;
