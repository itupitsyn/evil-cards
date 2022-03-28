const express = require('express');
require('dotenv').config();

const { generateCard, languages } = require('./creator');

const app = express();
const PORT = process.env.PORT ?? 3000;

app.set('view engine', 'hbs');

app.get('/', async (req, res) => {
  res.render('index', { languages: languages() });
});

app.get('/postcard/:lang?', async (req, res, next) => {
  try {
    const filename = await generateCard(req.params.lang);
    if (filename) res.download(filename);
    else res.render('index', { languages: languages(), error: true });
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  if (err) {
    res.status(500).send(err.toString());
  } else {
    next();
  }
});

function start() {
  app.listen(PORT, () => console.log(`listening ${PORT}...`));
}

module.exports = { start };
