const express = require('express');
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const app = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/url_shortener';

app.use(express.json());

const urlSchema = new mongoose.Schema({
  shortId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  longUrl: {
    type: String,
    required: true,
  },
  accessCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ShortUrl = mongoose.model('ShortUrl', urlSchema);

app.post('/shortUrl', async (req, res) => {
  try {
    const { longUrl } = req.body;
    if (!longUrl || typeof longUrl !== 'string') {
      return res.status(400).json({ error: 'longUrl is required and must be a string.' });
    }

    const shortId = nanoid(8);
    const record = new ShortUrl({ shortId, longUrl });
    await record.save();

    res.status(201).json({
      shortId,
      longUrl,
      shortUrl: `${req.protocol}://${req.get('host')}/${shortId}`,
      accessCount: record.accessCount,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Short ID already exists. Please retry.' });
    }
    res.status(500).json({ error: 'Failed to create short URL.' });
  }
});

app.get('/:shortId', async (req, res) => {
  try {
    const { shortId } = req.params;
    const record = await ShortUrl.findOneAndUpdate(
      { shortId },
      { $inc: { accessCount: 1 } },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({ error: 'Short URL not found.' });
    }

    res.redirect(record.longUrl);
  } catch (error) {
    res.status(500).json({ error: 'Failed to redirect to long URL.' });
  }
});

app.patch('/:shortId', async (req, res) => {
  try {
    const { shortId } = req.params;
    const updates = {};
    const { longUrl, accessCount } = req.body;

    if (longUrl !== undefined) {
      if (!longUrl || typeof longUrl !== 'string') {
        return res.status(400).json({ error: 'longUrl must be a non-empty string.' });
      }
      updates.longUrl = longUrl;
    }

    if (accessCount !== undefined) {
      if (!Number.isInteger(accessCount) || accessCount < 0) {
        return res.status(400).json({ error: 'accessCount must be a non-negative integer.' });
      }
      updates.accessCount = accessCount;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Provide longUrl or accessCount to update.' });
    }

    const record = await ShortUrl.findOneAndUpdate({ shortId }, updates, { new: true });
    if (!record) {
      return res.status(404).json({ error: 'Short URL not found.' });
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update short URL.' });
  }
});

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(port, () => {
      console.log(`URL shortener running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  });
