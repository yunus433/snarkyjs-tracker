const Member = require('../../../models/member/Member');

module.exports = (req, res) => {
  Member.findMemberByEmailAndVerifyPassword({
    email: req.session.member.email, 
    password: req.body.current_password
  }, (err, member) => {
    if (err) {
      res.write(JSON.stringify({ error: err, success: false }));
      return res.end();
    }

    Member.findMemberByIdAndUpdatePassword(member._id, req.body, (err, member) => {
      if (err) {
        res.write(JSON.stringify({ error: 'bad_request', success: false }));
        return res.end();
      }

      res.write(JSON.stringify({ member, success: true }));
      return res.end();
    });
  });
};