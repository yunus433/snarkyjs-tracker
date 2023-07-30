const express = require('express');

const router = express.Router();

const createNavbarData = require('../middleware/createNavbarData');
const isMember = require('../middleware/isMember');

const repositoriesGetController = require('../controllers/repositories/index/get');
const repositoriesDetailsGetController = require('../controllers/repositories/details/get');

router.get(
  '/',
  isMember,
  createNavbarData,
  repositoriesGetController
);

router.get(
  '/details',
  isMember,
  createNavbarData,
  repositoriesDetailsGetController
);

module.exports = router;