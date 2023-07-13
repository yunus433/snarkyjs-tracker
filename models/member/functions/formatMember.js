module.exports = (member, callback) => {
  if (!member || !member._id)
    return callback('document_not_found');

  return callback(null, {
    _id: member._id.toString(),
    email: member.email,
    is_completed: member.is_completed,
    name: member.name
  });
};