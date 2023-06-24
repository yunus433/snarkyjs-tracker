const express = require('express');

const router = express.Router();

const isAdmin = require('../middleware/isAdmin');

const memberGetController = require('../controllers/member/index/get');
const createMemberGetController = require('../controllers/member/create/get');
const createMemberPostController = require('../controllers/member/create/post');

router.get(
  '/',
  isAdmin,
  memberGetController
);

router.get(
  '/create',
  isAdmin,
  createMemberGetController
);

router.post(
  '/create',
  isAdmin,
  createMemberPostController
);

module.exports = router;