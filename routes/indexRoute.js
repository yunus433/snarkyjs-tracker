const express = require('express');

const router = express.Router();

const createNavbarData = require('../middleware/createNavbarData');
const isMember = require('../middleware/isMember');

const errorGetController = require('../controllers/index/error/get');
const indexGetController = require('../controllers/index/index/get');

router.get(
  '/',
    isMember,
    createNavbarData,
    indexGetController
);
router.get(
  '/error',
    errorGetController
);

module.exports = router;
