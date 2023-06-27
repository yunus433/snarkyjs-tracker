const express = require('express');

const router = express.Router();

const isMember = require('../middleware/isMember');

const indexGetController = require('../controllers/index/get');

router.get(
  '/',
  isMember,
  indexGetController
);

module.exports = router;
