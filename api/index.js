
import express from "express";
import xml2js from "xml2js";
import cors from "cors";

const app = express();
app.use(cors());

app.get("/api/hiru-news", async (req, res) => {
  try {
    const feedUrl = "https://www.hirunews.lk/rss";
    const response = await fetch(feedUrl);

    if (!response.ok) {
      return res.status(500).json({ error: "Failed to fetch RSS feed" });
    }

    const xml = await response.text();

    const parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: true,
      trim: true,
      normalize: true,
      normalizeTags: true
    });

    parser.parseString(xml, (err, result) => {
      if (err) {
        console.error("XML parse error:", err);
        return res.status(500).json({ error: err.message });
      }

      try {
        const items = result.rss.channel.item;
        const articles = Array.isArray(items) ? items : [items];

        const news = articles.map(item => ({
          title: item.title,
          link: item.link,
          published: item.pubDate,
          summary: item.description
        }));

        res.json(news);
      } catch (parseError) {
        console.error("Article mapping error:", parseError);
        res.status(500).json({ error: "Error processing articles" });
      }
    });
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default app;
