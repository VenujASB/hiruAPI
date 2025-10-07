import express from "express";
import cors from "cors";
import Parser from "rss-parser";

const app = express();
app.use(cors());

const parser = new Parser({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
  },
  timeout: 10000,
});

app.get("/api/hiru-news", async (req, res) => {
  try {
    const feed = await parser.parseURL("https://www.hirunews.lk/rss");
    if (!feed?.items?.length) {
      return res.status(500).json({ error: "No articles found in feed" });
    }

    const news = feed.items.map((item) => ({
      title: item.title || "Untitled",
      link: item.link || "",
      published: item.pubDate || item.isoDate || "",
      summary: item.contentSnippet || item.content || "",
    }));

    res.json(news);
  } catch (error) {
    console.error("Error fetching RSS:", error.message);
    res.status(500).json({ error: "Failed to fetch or parse Hiru News feed" });
  }
});

export default app;
