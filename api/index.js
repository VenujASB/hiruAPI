import express from "express";
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
        let xml = "";

        response.on("data", (chunk) => {
          xml += chunk;
        });

        response.on("end", () => {
          if (!xml) {
            return res
              .status(500)
              .json({ error: "No data received from Hiru News" });
          }

          // Clean and normalize XML a bit
          xml = xml.replace(/\r?\n|\r/g, "").trim();

          // Extract each <item>...</item>
          const items = xml.match(/<item>[\s\S]*?<\/item>/g);
          if (!items) {
            return res
              .status(500)
              .json({ error: "No news items found in Hiru News feed" });
          }

          // Parse each <item>
          const news = items.map((item) => {
            const getTag = (tag) => {
              const match = item.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
              return match ? match[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
            };

            return {
              title: getTag("title"),
              link: getTag("link"),
              published: getTag("pubDate"),
              summary: getTag("description")
            };
          });

          res.json(news);
        });
      }
    ).on("error", (err) => {
      console.error("HTTPS error:", err);
      res.status(500).json({ error: "Failed to fetch Hiru News feed" });
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default app;
