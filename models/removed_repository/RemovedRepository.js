const mongoose = require('mongoose');

const DUPLICATED_UNIQUE_FIELD_ERROR_CODE = 11000;
const MAX_DATABASE_TEXT_FIELD_LENGTH = 1e4;
// const TWO_HOURS_IN_MILLISECONDS = 2 * 60 * 60 * 1000;

const Schema = mongoose.Schema;

const RemovedRepositorySchema = new Schema({
  github_id: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  },
  last_accessed_at: {
    type: Number,
    required: true,
    index: true
  }
});

RemovedRepositorySchema.statics.findRemovedRepositoryByGitHubId = function (github_id, callback) {
  const RemovedRepository = this;

  if (!github_id || typeof github_id != 'string' || !github_id.trim().length || github_id.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');

  RemovedRepository.findOneAndUpdate({
    github_id: github_id.trim()
  }, { $set: {
    last_accessed_at: Date.now()
  } }, { new: true }, (err, removed_repository) => {
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
    github_id: data.github_id.trim(),
    last_accessed_at: Date.now()
  });

  newRemovedRepository.save((err, removed_repository) => {
    if (err && err.code == DUPLICATED_UNIQUE_FIELD_ERROR_CODE)
      return callback('duplicated_unique_field');
    if (err) return callback('database_error');

    return callback(null, removed_repository);
  });
};

// RemovedRepositorySchema.statics.findOldRemovedRepositoriesAndDelete = function (callback) {
//   const RemovedRepository = this;

//   const twoHoursAgo = Date.now() - TWO_HOURS_IN_MILLISECONDS;

//   RemovedRepository.deleteMany({
//     last_accessed_at: { $lt: twoHoursAgo }
//   }, err => {
//     if (err) return callback('database_error');

//     return callback(null);
//   });
// };

module.exports = mongoose.model('RemovedRepository', RemovedRepositorySchema);
