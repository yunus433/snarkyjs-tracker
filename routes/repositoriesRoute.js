const express = require('express');

const router = express.Router();

const createNavbarData = require('../middleware/createNavbarData');
const generateConstantData = require('../middleware/generateConstantData');
const isMember = require('../middleware/isMember');

const repositoriesGetController = require('../controllers/repositories/index/get');
const repositoriesDetailsGetController = require('../controllers/repositories/details/get');
const repositoriesExportGetController = require('../controllers/repositories/export/get');

router.get(
  '/',
  isMember,
  createNavbarData,
  generateConstantData,
  repositoriesGetController
);

router.get(
  '/details',
  isMember,
  createNavbarData,
  generateConstantData,
  repositoriesDetailsGetController
);

router.get(
  '/export',
  isMember,
  repositoriesExportGetController
);

module.exports = router;