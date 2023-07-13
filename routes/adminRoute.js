const express = require('express');

const router = express.Router();

const isAdmin = require('../middleware/isAdmin');

const editGetController = require('../controllers/admin/edit/get');
const indexGetController = require('../controllers/admin/index/get');
const loginGetController = require('../controllers/admin/login/get');

const createPostController = require('../controllers/admin/create/post');
const deletePostController = require('../controllers/admin/delete/post');
const editPostController = require('../controllers/admin/edit/post');
const loginPostController = require('../controllers/admin/login/post');
const passwordPostController = require('../controllers/admin/password/post');

router.get(
  '/',
    isAdmin,
    indexGetController
);
router.get(
  '/edit',
    isAdmin,
    editGetController
);
router.get(
  '/login',
    loginGetController
);

router.post(
  '/create',
    isAdmin,
    createPostController
);
router.post(
  '/delete',
    isAdmin,
    deletePostController
);
router.post(
  '/edit',
    isAdmin,
    editPostController
);
router.post(
  '/login',
    loginPostController
);
router.post(
  '/password',
    isAdmin,
    passwordPostController
);

module.exports = router;