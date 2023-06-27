const express = require('express');

const router = express.Router();

const loginGetController = require('../controllers/login/get');

const loginPostController = require('../controllers/login/post');

router.get(
  '/',
  loginGetController
);

router.post(
  '/',
  loginPostController
);

module.exports = router;