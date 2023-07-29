const express = require('express');

const router = express.Router();

const createNavbarData = require('../middleware/createNavbarData');
const isMember = require('../middleware/isMember');

const developersGetController = require('../controllers/developers/index/get');
const developersDetailsGetController = require('../controllers/developers/details/get');

router.get(
  '/',
  isMember,
  createNavbarData,
  developersGetController
);

router.get(
  '/details',
  isMember,
  createNavbarData,
  developersDetailsGetController
);

module.exports = router;