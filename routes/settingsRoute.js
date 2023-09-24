const express = require('express');

const router = express.Router();

const createNavbarData = require('../middleware/createNavbarData');
const isMember = require('../middleware/isMember');

const indexGetController = require('../controllers/settings/index/get');
const editPostController = require('../controllers/settings/edit/post');
const passwordPostController = require('../controllers/settings/password/post');

router.get(
  '/',
  isMember,
  createNavbarData,
  indexGetController
);

router.post(
  '/edit',
  isMember,
  editPostController
);
router.post(
  '/password',
  isMember,
  passwordPostController
);

module.exports = router;