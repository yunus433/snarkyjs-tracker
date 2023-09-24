const express = require('express');

const router = express.Router();

const createNavbarData = require('../middleware/createNavbarData');
const generateConstantData = require('../middleware/generateConstantData');
const isMember = require('../middleware/isMember');

const developersGetController = require('../controllers/developers/index/get');
const developersDetailsGetController = require('../controllers/developers/details/get');
const developersExportGetController = require('../controllers/developers/export/get');

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

router.get(
  '/export',
  isMember,
  developersExportGetController
);

module.exports = router;