const mongoose = require('mongoose');

const DUPLICATED_UNIQUE_FIELD_ERROR_CODE = 11000;
const MAX_DATABASE_TEXT_FIELD_LENGTH = 1e4;

const Schema = mongoose.Schema;

const LookedRepositorySchema = new Schema({
  repository_id: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  }
});

LookedRepositorySchema.statics.createMember = function (data, callback) {
  const LookedRepository = this;

  if (!data || typeof data != 'object')
    return callback('bad_request');

  if (!data.repository_id || !(data.repository_id.toString().length < MAX_DATABASE_TEXT_FIELD_LENGTH))
    return callback('bad_request');

  const newLookedRepositoryData = {
    repository_id: data.repository_id.toString()
  };

  const newLookedRepository = new LookedRepository(newLookedRepositoryData);

  newLookedRepository.save((err, repository) => {
    if (err && err.code == DUPLICATED_UNIQUE_FIELD_ERROR_CODE)
      return callback('duplicated_unique_field');
    if (err)
      return callback('database_error');

    LookedRepository.collection
      .createIndex({ repository_id: 1 }, { unique: true })
      .then(() => callback(null, repository._id.toString()))
      .catch(() => callback('database_error'));
  });
};

module.exports = mongoose.model('LookedRepository', LookedRepositorySchema);
