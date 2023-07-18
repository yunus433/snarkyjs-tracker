const Member = require('../../../models/member/Member');

module.exports = (req, res) => {
  Member.findMemberByEmailAndVerifyPassword(req.body, (err, member) => {
    if (err)
      return res.json({ success: false, error: err });

    req.session.member = member;

    return res.json({ success: true, member });
  });
}