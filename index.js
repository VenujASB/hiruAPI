import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());

app.get("/api/hiru-news", async (req, res) => {
  try {
    const proxyUrl = "https://api.rss2json.com/v1/api.json?rss_url=https://www.hirunews.lk/rss";
    const response = await fetch(proxyUrl);
    const data = await response.json();

    if (!data.items) {
      return res.status(500).json({ error: "No news items found" });
    }

    const news = data.items.map(item => ({
      title: item.title,
      link: item.link,
      published: item.pubDate,
      summary: item.description
    }));

    res.json(news);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch or parse Hiru News feed" });
  }
});

app.listen(process.env.PORT || 3000, () => console.log("Server running"));
