import express from "express";
import xml2js from "xml2js";
import cors from "cors";

const app = express();
app.use(cors());

app.get("/api/hiru-news", async (req, res) => {
    try {
        const feedUrl = "https://www.hirunews.lk/rss";
        const response = await fetch(feedUrl); // native fetch in Node 18+
        const xml = await response.text();

        xml2js.parseString(xml, (err, result) => {
            if (err) return res.status(500).json({ error: err.message });

            const articles = result.rss.channel[0].item.map(item => ({
                title: item.title[0],
                link: item.link[0],
                published: item.pubDate[0],
                summary: item.description[0]
            }));

            res.json(articles);
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default app;
