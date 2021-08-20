
/*
    PURPOSE:  module where various sensors are defined and their data is acquired
    TODO:     make connected sensors to  be plug-and-play: parse returned json and return a list compatible with model
*/

import express from 'express';
import * as bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import https from 'https';

export function startTestHttpServer()
{
  const PORT = 3001;

  const app = express();
  const router = express.Router();
  // this.router = router;

  app.use(bodyParser.json());
  app.use(cors());
  app.use('/', router);

  // defining fallback route here
  app.get('/tests/click', (req, res) =>
  {
    res.status(200).send('{}');
  });

  app.listen(PORT, () =>
  {
    console.log(`[TEST] server de test pe portul ${PORT}`);
  });
}

const httpsServer = https.createServer({
  cert: fs.readFileSync('/home/focus7/certbot/fullchain1.pem'),
  key: fs.readFileSync('/home/focus7/certbot/privkey1.pem')
});
