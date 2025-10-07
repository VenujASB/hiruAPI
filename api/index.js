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
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
          Accept: "application/rss+xml,application/xml;q=0.9,*/*;q=0.8",
          Referer: "https://www.google.com/"
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

          // 🧹 Clean & normalize XML
          xml = xml.replace(/\r?\n|\r/g, "").trim();

          // 🔍 Try to find any repeating tag type (<item>, <entry>, <news>...)
          const tagMatch = xml.match(/<(\w+)>[\s\S]*?<\/\1>/g);
          if (!tagMatch) {
            return res.status(500).json({
              error: "No structured content found in feed (maybe blocked)"
            });
          }

          // Find the most repeated tag name
          const tagCounts = {};
          tagMatch.forEach((tag) => {
            const tagName = tag.match(/^<(\w+)>/)?.[1];
            if (tagName) tagCounts[tagName] = (tagCounts[tagName] || 0) + 1;
          });

          const mainTag = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .find(([tag]) => !["rss", "channel", "title", "link"].includes(tag));

          if (!mainTag) {
            return res
              .status(500)
              .json({ error: "No valid article tags found in feed" });
          }

          const tag = mainTag[0];
          const items = xml.match(new RegExp(`<${tag}>[\\s\\S]*?<\\/${tag}>`, "g"));
          if (!items || items.length === 0) {
            return res
              .status(500)
              .json({ error: "No news items found in Hiru News feed" });
          }

          const news = items.map((item) => {
            const getTag = (t) => {
              const match = item.match(new RegExp(`<${t}>([\\s\\S]*?)<\\/${t}>`));
              return match
                ? match[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim()
                : "";
            };

            return {
              title: getTag("title"),
              link: getTag("link"),
              published: getTag("pubDate") || getTag("date"),
              summary: getTag("description") || getTag("summary") || ""
            };
          });

          res.json(news.filter((n) => n.title));
        });
      }
    ).on("error", (err) => {
      console.error("HTTPS request error:", err);
      res.status(500).json({ error: "Failed to fetch Hiru News feed" });
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default app;
