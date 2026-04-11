import express from 'express';
import app from './api/index.js';

app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Kofo running on http://localhost:${PORT}`);
});
