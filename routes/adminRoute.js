const express = require('express');

const router = express.Router();

const adminGetController = require('../controllers/admin/get');

const adminPostController = require('../controllers/admin/post');

router.get(
  '/',
  adminGetController
);

router.post(
  '/',
  adminPostController
);

module.exports = router;