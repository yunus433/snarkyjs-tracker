const Member = require('../../models/member/Member');

module.exports = (req, res) => {
  console.log(req.body);
  Member.findMemberByEmailAndVerifyPassword(req.body, (err, member) => {
    if (err) {
      res.write(JSON.stringify({ error: err, success: false }));
      return res.end();
    }

    getMember(member._id, (err, member) => {
      if (err) {
        res.write(JSON.stringify({ error: err, success: false }));
        return res.end();
      }

      req.session.member = member;
      console.log(req.session);

      res.write(JSON.stringify({ redirect: req.session.redirect, success: true }));
      return res.end();
    });
  });
}