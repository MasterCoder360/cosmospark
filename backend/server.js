import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import cors from 'cors';

const app = express();
app.use(cors());

app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  console.log(`Search requested for: "${query}"`);
  
  if (!query) return res.status(400).json({ error: 'Query is required' });

  try {
    const response = await axios.get(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      }
    });

    const $ = cheerio.load(response.data);
    const results = [];

    $('.result').each((i, el) => {
      const titleEl = $(el).find('.result__title a');
      const snippetEl = $(el).find('.result__snippet');
      
      if (titleEl.length) {
        results.push({
          title: titleEl.text().trim(),
          url: titleEl.attr('href'),
          snippet: snippetEl.text().trim()
        });
      }
    });

    console.log(`Found ${results.length} results.`);
    res.json({ results });
  } catch (error) {
    console.error('Backend Scraping Error:');
    if (error.response) {
      console.error(`Status Code: ${error.response.status}`);
      console.error(`Response Data: ${error.response.data.substring(0, 300)}...`);
    } else {
      console.error(error.message);
    }
    res.status(500).json({ error: 'Failed to fetch results from search engine.' });
  }
});

app.listen(3001, () => console.log('Backend running on port 3001'));