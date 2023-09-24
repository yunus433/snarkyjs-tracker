const express = require('express');

const router = express.Router();

const createNavbarData = require('../middleware/createNavbarData');
const generateConstantData = require('../middleware/generateConstantData');
const isMember = require('../middleware/isMember');

const repositoriesGetController = require('../controllers/repositories/index/get');
const repositoriesDetailsGetController = require('../controllers/repositories/details/get');
const repositoriesExportGetController = require('../controllers/repositories/export/get');
const repositoriesAddGetController = require('../controllers/repositories/add/get');
const repositoriesAddPostController = require('../controllers/repositories/add/post');

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

router.get(
  '/add',
  isMember,
  createNavbarData,
  generateConstantData,
  repositoriesAddGetController
);

router.post(
  '/add',
  isMember,
  createNavbarData,
  generateConstantData,
  repositoriesAddPostController
);

module.exports = router;