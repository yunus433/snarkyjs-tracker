const Member = require('../models/member/Member');
const fs = require('fs');

module.exports = (req, res, next) => {
  if (req.session && req.session.member) {
    Member.findMemberByIdAndFormat(req.session.member._id, (err, member) => {
      if (err) return res.status(401).redirect('/auth/login');
      
      req.session.member = member;
      return next();
    });
  } else {
    if (req.file && req.file.filename) {
      fs.unlink('./public/res/uploads/' + req.file.filename, () => {
        req.session.redirect = req.originalUrl;

        return res.status(401).redirect('/auth/login');
      });
    } else {
      req.session.redirect = req.originalUrl;

      return res.status(401).redirect('/auth/login');
    }
  };
};
