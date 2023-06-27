const Member = require('../Member');

module.exports = (id, callback) => {
  if (!id)
    return callback('document_not_found');


  Member.findById(id, (err, id) => {
    if (err || !id)
      return callback('document_not_found');

    return callback(null, {
      _id: id._id.toString(),
      email: id.email
    });
  });
};