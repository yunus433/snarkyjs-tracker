const express = require('express');

const router = express.Router();

const createNavbarData = require('../middleware/createNavbarData');
const isAdmin = require('../middleware/isAdmin');

const developersGetController = require('../controllers/developers/index/get');
const developersDetailsGetController = require('../controllers/developers/details/get');

router.get(
  '/',
  isAdmin,
  createNavbarData,
  developersGetController
);

router.get(
  '/details',
  isAdmin,
  createNavbarData,
  developersDetailsGetController
);

module.exports = router;