const express = require('express');

const router = express.Router();

const createNavbarData = require('../middleware/createNavbarData');
const generateConstantData = require('../middleware/generateConstantData');
const isMember = require('../middleware/isMember');

const developersGetController = require('../controllers/developers/index/get');
const developersDetailsGetController = require('../controllers/developers/details/get');

router.get(
  '/',
  isMember,
  createNavbarData,
  generateConstantData,
  developersGetController
);

router.get(
  '/details',
  isMember,
  createNavbarData,
  generateConstantData,
  developersDetailsGetController
);

module.exports = router;