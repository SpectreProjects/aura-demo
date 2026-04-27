import 'dotenv/config';
import express from 'express';

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.static('public'));

app.listen(port, () => {
  console.log(`AURA mock dashboard running at http://localhost:${port}`);
});
