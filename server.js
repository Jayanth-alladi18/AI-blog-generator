require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const historyFile = path.join(__dirname, 'history.json');

/**
 * Save user search to history.json
 */
function saveSearch(topic, length) {
  const entry = {
    topic,
    length,
    time: new Date().toISOString()
  };

  let history = [];
  try {
    if (fs.existsSync(historyFile)) {
      const fileContent = fs.readFileSync(historyFile, 'utf8');
      history = JSON.parse(fileContent || '[]');
    }
  } catch (error) {
    console.error('Error reading history file:', error);
  }

  history.push(entry);

  try {
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('Error writing history file:', error);
  }
}

app.post('/generate', async (req, res) => {
  const { topic, length = 'medium' } = req.body;

  if (!topic || typeof topic !== 'string') {
    return res.status(400).json({ error: 'A valid topic is required.' });
  }

  saveSearch(topic, length);

  try {
    const model = genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash' });
    const prompt = `Write a ${length} blog post in a clear, structured format about the topic: "${topic}". Avoid using symbols like # or *. Format it with clean paragraphs.`;

    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    res.json({ post: text });
  } catch (error) {
    console.error('Gemini error:', error.message);
    res.status(500).json({ error: 'Failed to generate content from Gemini API.' });
  }
});

app.get('/history', (req, res) => {
  try {
    const history = fs.existsSync(historyFile)
      ? JSON.parse(fs.readFileSync(historyFile, 'utf8'))
      : [];
    res.json(history);
  } catch (error) {
    console.error('Error reading history:', error.message);
    res.status(500).json({ error: 'Failed to load history.' });
  }
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
  });
} else {
  module.exports = app; // Export app for testing
}
