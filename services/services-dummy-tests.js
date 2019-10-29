
/*
    PURPOSE:  module where various sensors are defined and their data is acquired
    TODO:     make connected sensors to  be plug-and-play: parse returned json and return a list compatible with model
*/

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');

function startTestHttpServer () {
  const PORT = 3001;

  const app = express();
  const router = express.Router();
  this.router = router;

  app.use(bodyParser.json());
  app.use(cors());
  app.use('/', router);

  // defining fallback route here
  app.get('/tests/click', function (req, res) {
    res.status(200).send('{}');
  });

  app.listen(PORT, function () {
    console.log(`[TEST] server de test pe portul ${PORT}`);
  });
}

module.exports = {
  startTestHttpServer: startTestHttpServer
};
