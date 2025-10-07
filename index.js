import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

// Root route for testing
app.get("/", (req, res) => {
  res.send("✅ Hiru News API is running!");
});

app.get("/api/hiru-news", async (req, res) => {
  try {
    // RSS feed proxy — avoids block by Hiru News
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
