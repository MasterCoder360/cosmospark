import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Query is required' });

  try {
    const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`);
    const data = await response.json();

    const results = data.query.search.map(item => ({
      title: item.title,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
      snippet: item.snippet.replace(/<[^>]*>?/gm, '')
    }));

    res.json({ results });
  } catch (error) {
    console.error('Search Error:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));