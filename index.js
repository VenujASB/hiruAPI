import express from "express";
import cors from "cors";
import Parser from "rss-parser";

const app = express();
app.use(cors());

const parser = new Parser();

app.get("/", (req, res) => {
  res.send("✅ Hiru News API is running!");
});

app.get("/api/hiru-news", async (req, res) => {
  try {
    const feedUrl = encodeURIComponent("https://www.hirunews.lk/rss");
    const proxyUrl = `https://api.allorigins.win/raw?url=${feedUrl}`;

    const feed = await parser.parseURL(proxyUrl);

    if (!feed?.items?.length) {
      return res.status(500).json({ error: "No news items found" });
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
