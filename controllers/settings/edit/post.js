const Member = require('../../../models/member/Member');

module.exports = (req, res) => {
  Member.findMemberByIdAndUpdate(req.session.member._id, req.body, (err, member) => {
    if (err) {
      res.write(JSON.stringify({ error: 'bad_request', success: false }));
      return res.end();
    }

    res.write(JSON.stringify({ member, success: true }));
    return res.end();
  });
};