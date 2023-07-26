const express = require('express');

const router = express.Router();

const createNavbarData = require('../middleware/createNavbarData');
const isAdmin = require('../middleware/isAdmin');

const repositoriesGetController = require('../controllers/repositories/index/get');
const repositoriesDetailsGetController = require('../controllers/repositories/details/get');

router.get(
  '/',
  isAdmin,
  createNavbarData,
  repositoriesGetController
);

router.get(
  '/details',
  isAdmin,
  createNavbarData,
  repositoriesDetailsGetController
);

module.exports = router;