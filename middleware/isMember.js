const Member = require('../models/member/Member');

module.exports = (req, res, next) => {
  if (req.session && req.session.member)
    return next();

  // TODO

  return res.status(401).redirect('/login');
}