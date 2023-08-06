const express = require('express');

const router = express.Router();

const createNavbarData = require('../middleware/createNavbarData');
const generateConstantData = require('../middleware/generateConstantData');
const isMember = require('../middleware/isMember');

const repositoriesGetController = require('../controllers/repositories/index/get');
const repositoriesDetailsGetController = require('../controllers/repositories/details/get');

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

module.exports = router;