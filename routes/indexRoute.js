const express = require('express');

const router = express.Router();

const indexGetController = require('../controllers/index/get');
const loginGetController = require('../controllers/login/get');

router.get(
  '/',
  indexGetController
);
router.get(
  '/login',
  loginGetController
);

module.exports = router;
