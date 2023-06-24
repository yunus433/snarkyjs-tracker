const express = require('express');

const router = express.Router();

const isAdmin = require('../middleware/isAdmin');

const indexGetController = require('../controllers/index/get');

router.get(
  '/',
  isAdmin,
  indexGetController
);

module.exports = router;
