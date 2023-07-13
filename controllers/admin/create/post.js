const Member = require('../../../models/member/Member');

const generateRandomHEX = require('../../../utils/generateRandomHEX');

module.exports = (req, res) => {
  req.body.password = generateRandomHEX(16);

  Member.createMember(req.body, (err, member) => {
    if (err) {
      res.write(JSON.stringify({ error: 'bad_request', success: false }));
      return res.end();
    }

    res.write(JSON.stringify({ success: true, member }));
    return res.end();
  });
};