const mongoose = require('mongoose');

const DUPLICATED_UNIQUE_FIELD_ERROR_CODE = 11000;
const MAX_DATABASE_TEXT_FIELD_LENGTH = 1e4;

const Schema = mongoose.Schema;

const RemovedRepositorySchema = new Schema({
  github_id: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  }
});

RemovedRepositorySchema.statics.findRemovedRepositoryByGitHubId = function (github_id, callback) {
  const RemovedRepository = this;

  if (!github_id || typeof github_id != 'string' || !github_id.trim().length || github_id.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');

  RemovedRepository.findOne({
    github_id: github_id.trim()
  }, (err, removed_repository) => {
    if (err) return callback('database_error');
    if (!removed_repository) return callback('document_not_found');

    return callback(null, removed_repository);
  });
};

RemovedRepositorySchema.statics.createRemovedRepository = function (data, callback) {
  const RemovedRepository = this;

  if (!data.github_id || typeof data.github_id != 'string' || !data.github_id.trim().length || data.github_id.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');

  const newRemovedRepository = new RemovedRepository({
    github_id: data.github_id.trim()
  });

  newRemovedRepository.save((err, removed_repository) => {
    if (err && err.code == DUPLICATED_UNIQUE_FIELD_ERROR_CODE)
      return callback(null);
    if (err) return callback('database_error');

    return callback(null, removed_repository);
  });
};

module.exports = mongoose.model('RemovedRepository', RemovedRepositorySchema);
