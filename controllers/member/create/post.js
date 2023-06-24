const Member = require('../../../models/member/Member');

module.exports = (req, res) => {
  Member.createMember(req.body, (err, member) => {
    if (err) {
      res.write(JSON.stringify({ error: 'bad_request', success: false }));
      return res.end();
    }

    res.write(JSON.stringify({ success: true }));
    return res.end();
  });
};