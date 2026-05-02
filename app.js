const express = require('express');
const { nanoid } = require('nanoid');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const urlStore = new Map();

app.post('/shortUrl', (req, res) => {
  try {
    const { longUrl } = req.body;
    if (!longUrl || typeof longUrl !== 'string') {
      return res.status(400).json({ error: 'longUrl is required and must be a string.' });
    }

    const shortId = nanoid(8);
    const record = {
      shortId,
      longUrl,
      accessCount: 0,
      createdAt: new Date(),
    };
    urlStore.set(shortId, record);

    res.status(201).json({
      shortId,
      longUrl,
      shortUrl: `${req.protocol}://${req.get('host')}/${shortId}`,
      accessCount: record.accessCount,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create short URL.' });
  }
});

app.get('/:shortId', (req, res) => {
  try {
    const { shortId } = req.params;
    const record = urlStore.get(shortId);

    if (!record) {
      return res.status(404).json({ error: 'Short URL not found.' });
    }

    record.accessCount += 1;
    res.redirect(record.longUrl);
  } catch (error) {
    res.status(500).json({ error: 'Failed to redirect to long URL.' });
  }
});

app.patch('/:shortId', (req, res) => {
  try {
    const { shortId } = req.params;
    const record = urlStore.get(shortId);

    if (!record) {
      return res.status(404).json({ error: 'Short URL not found.' });
    }

    const updates = {};
    const { longUrl, accessCount } = req.body;

    if (longUrl !== undefined) {
      if (!longUrl || typeof longUrl !== 'string') {
        return res.status(400).json({ error: 'longUrl must be a non-empty string.' });
      }
      record.longUrl = longUrl;
    }

    if (accessCount !== undefined) {
      if (!Number.isInteger(accessCount) || accessCount < 0) {
        return res.status(400).json({ error: 'accessCount must be a non-negative integer.' });
      }
      record.accessCount = accessCount;
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update short URL.' });
  }
});

app.listen(port, () => {
  console.log(`URL shortener running on http://localhost:${port}`);
});
