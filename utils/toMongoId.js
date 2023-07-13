const mongoose = require('mongoose');
const validator = require('validator');

module.exports = _str => {
  if (!_str)
    return '';

  const str = _str.toString().trim();
  if (!validator.isMongoId(str))
    return '';

  return mongoose.Types.ObjectId(str);
}