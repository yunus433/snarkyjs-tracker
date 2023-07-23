const express = require('express');

const router = express.Router();

const isAdmin = require('../middleware/isAdmin');

const repositoriesGetController = require('../controllers/repositories/index/get');
const repositoriesDetailsGetController = require('../controllers/repositories/details/get');

router.get(
  '/',
  isAdmin,
  repositoriesGetController
);

router.get(
  '/details',
  isAdmin,
  repositoriesDetailsGetController
);

module.exports = router;