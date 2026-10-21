import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';

const app = express();
app.use(cors());

app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Query is required' });

  try {
    const targetUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const scraperUrl = `http://api.scraperapi.com?api_key=${process.env.SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}`;
    
    const response = await axios.get(scraperUrl);
    const $ = cheerio.load(response.data);
    const results = [];

    $('.result').each((i, el) => {
      const titleEl = $(el).find('.result__title a');
      const snippetEl = $(el).find('.result__snippet');
      
      if (titleEl.length) {
        let rawUrl = titleEl.attr('href');
        let finalUrl = rawUrl;

        if (rawUrl && rawUrl.includes('uddg=')) {
          try {
            const urlObj = new URL(rawUrl, 'https://duckduckgo.com');
            finalUrl = decodeURIComponent(urlObj.searchParams.get('uddg'));
          } catch (e) {}
        }

        results.push({
          title: titleEl.text().trim(),
          url: finalUrl,
          snippet: snippetEl.text().trim()
        });
      }
    });

    res.json({ results });
  } catch (error) {
    console.error('Search Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));