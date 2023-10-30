const mongoose = require('mongoose');
const validator = require('validator');

module.exports = _str => {
  try {
    if (!_str)
      return null;

    const str = _str.toString().trim();
    if (!validator.isMongoId(str))
      return null;

    return mongoose.Types.ObjectId(str);
  } catch (_) {
    return null;
  }
}