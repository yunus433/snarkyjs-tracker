const express = require('express');

const router = express.Router();

const repositoryMonthlyDetailsGetController = require('../controllers/api/repository/monthly/details/get');
const repositoryMonthlyIndexGetController = require('../controllers/api/repository/monthly/index/get');
const repositoryYearlyGetController = require('../controllers/api/repository/yearly/get');

router.get(
  '/repository/monthly',
    repositoryMonthlyIndexGetController
);
router.get(
  '/repository/monthly/details',
    repositoryMonthlyDetailsGetController
);
router.get(
  '/repository/yearly',
    repositoryYearlyGetController
);

module.exports = router;