const mongoose = require('mongoose');

const DUPLICATED_UNIQUE_FIELD_ERROR_CODE = 11000;
const MAX_DATABASE_TEXT_FIELD_LENGTH = 1e4;

const Schema = mongoose.Schema;

const RepositorySchema = new Schema({
  repository_id: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  },
  is_checked: {
    type: Boolean,
    required: true,
    default: false
  },
  last_updated: {
    type: Date,
    required: true
  }
});

RepositorySchema.statics.createMember = function (data, callback) {
  const Repository = this;

  if (!data || typeof data != 'object')
    return callback('bad_request');

  if (!data.repository_id || !(data.repository_id.toString().length < MAX_DATABASE_TEXT_FIELD_LENGTH))
    return callback('bad_request');

  if (!data['is_checked'] || typeof data['is_checked'] != 'boolean')
    return callback('bad_request');

  if (!data.last_updated || typeof data.last_updated != 'object')
    return callback('bad_request');

  const newRepositoryData = {
    repository_id: data.repository_id.toString(),
    is_checked: data.is_checked,
    last_updated: data.last_updated
  };

  const newRepository = new Repository(newRepositoryData);

  newRepository.save((err, repository) => {
    if (err && err.code == DUPLICATED_UNIQUE_FIELD_ERROR_CODE)
      return callback('duplicated_unique_field');
    if (err)
      return callback('database_error');

    Repository.collection
      .createIndex({ repository_id: 1 }, { unique: true })
      .then(() => callback(null, repository._id.toString()))
      .catch(() => callback('database_error'));
  });
};

module.exports = mongoose.model('Repository', RepositorySchema);
