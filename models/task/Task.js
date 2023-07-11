// IMPORTANT NOTES!
// This class is a shadow model, should not be directly accessed in any way by a controller.
// It is managed by CronJob scripts

const mongoose = require('mongoose');

const DUPLICATED_UNIQUE_FIELD_ERROR_CODE = 11000;
const MAX_DATABASE_TEXT_FIELD_LENGTH = 1e4;
const TYPE_VALUES = ['query_repo', 'check_repo'];

const Schema = mongoose.Schema;

const RepositorySchema = new Schema({
  key: {

  },
  type: {

  },
  data: {

  }
});

module.exports = mongoose.model('Repository', RepositorySchema);
