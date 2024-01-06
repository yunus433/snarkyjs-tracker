const async = require('async');
const mongoose = require('mongoose');

const toMongoId = require('../../utils/toMongoId');

const formatDeveloper = require('./functions/formatDeveloper');

const DEFAULT_DOCUMENT_COUNT_PER_QUERY = 20;
const DUPLICATED_UNIQUE_FIELD_ERROR_CODE = 11000;
const MAX_DATABASE_TEXT_FIELD_LENGTH = 1e4;
const MAX_DOCUMENT_COUNT_PER_QUERY = 1e3;
const SORT_VALUES = ['login_lower'];

const Schema = mongoose.Schema;

const DeveloperSchema = new Schema({
  github_id: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  },
  login: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 1,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  },
  login_lower: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 1,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  },
  found_at: {
    type: Date,
    required: true
  },
  repository_count: {
    type: Number,
    default: 1,
    min: 1
  }
});

DeveloperSchema.statics.createOrUpdateDeveloper = function (data, callback) {
  const Developer = this;

  if (!data || typeof data != 'object')
    return callback('bad_request');

  if (!data.github_id || typeof data.github_id != 'string' || !data.github_id.trim().length || data.github_id.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');

  if (!data.login || typeof data.login != 'string' || !data.login.trim().length || data.login.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');

  const newDeveloper = new Developer({
    github_id: data.github_id.trim(),
    latest_update_time: Date.now(),
    login: data.login.trim(),
    login_lower: data.login.trim().toLowerCase(),
    found_at: new Date(),
    repository_count: 1
  });

  newDeveloper.save((err, developer) => {
    if (err && err.code == DUPLICATED_UNIQUE_FIELD_ERROR_CODE) {
      Developer.findOneAndUpdate({
        github_id: data.github_id.trim()
      }, {
        $set: {
          login: data.login.trim(),
        },
        $inc: {
          repository_count: 1
        }
      }, (err, developer) => {
        if (err) return callback(err);

        return callback(null, developer, false);
      });
    } else {
      if (err) return callback('database_error');

      return callback(null, developer, true);
    };
  });
};

DeveloperSchema.statics.findDeveloperByGitHubIdAndUpdate = function (github_id, data, callback) {
  const Developer = this;

  if (!github_id || typeof github_id != 'string' || !github_id.trim().length || github_id.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');

  if (!data || typeof data != 'object')
    return callback('bad_request');

  const update = {
    latest_update_time: Date.now()
  };

  if ('login' in data && typeof data.login == 'string' && data.login.trim().length && data.login.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH) {
    update.login = data.login.trim();
    update.login_lower = data.login_lower.trim();
  }

  Developer.findOneAndUpdate({
    github_id: github_id.trim()
  }, { $set: update }, { new: true }, (err, developer) => {
    if (err) return callback('database_error');
    if (!developer) return callback('document_not_found');

    return callback(null, developer);
  });
};

DeveloperSchema.statics.findDevelopersByFilters = function (data, callback) {
  const Developer = this;

  if (!data || typeof data != 'object')
    return callback('bad_request');

  const filters = {};

  let search = null;
  if (data.search && typeof data.search == 'string' && data.search.trim().length && data.search.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH) {
    search = data.search.trim();
    filters.$or = [
      { login: { $regex: data.search.trim(), $options: 'i' } }
    ];
  };

  const limit = data.limit && !isNaN(parseInt(data.limit)) && parseInt(data.limit) > 0 && parseInt(data.limit) < MAX_DOCUMENT_COUNT_PER_QUERY ? parseInt(data.limit) : DEFAULT_DOCUMENT_COUNT_PER_QUERY;
  const page = data.page && !isNaN(parseInt(data.page)) && parseInt(data.page) > 0 ? parseInt(data.page) : 0;
  const skip = page * limit;

  if (data.login_lower && typeof data.login_lower == 'string' && data.login_lower.trim().length && data.login_lower.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
    filters.login_lower = { $regex: data.login_lower.trim(), $options: 'i' };

  const sort_order = 'sort_order' in data && data.sort_order == -1 ? -1 : 1;
  let sort = { _id: sort_order };

  if (data.sort && typeof data.sort == 'string' && SORT_VALUES.includes(data.sort))
    sort = { [data.sort]: sort_order };

  Developer
    .find(filters)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .then(developers => async.timesSeries(
      developers.length,
      (time, next) => formatDeveloper(developers[time], (err, developer) => next(err, developer)),
      (err, developers) => callback(err, {
        search,
        developers,
        filters,
        limit,
        page,
        sort,
        sort_order
      })
    ))
    .catch(_ => callback('database_error'));
};

DeveloperSchema.statics.findDeveloperCountByFilters = function (data, callback) {
  const Developer = this;

  if (!data || typeof data != 'object')
    return callback('bad_request');

  const filters = {};
  
  if (data.search && typeof data.search == 'string' && data.search.trim().length && data.search.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
    filters.$or = [
      { login: { $regex: data.search.trim(), $options: 'i' } }
    ];

  if (data.login && typeof data.login == 'string' && data.login.trim().length && data.login.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
    filters.login = { $regex: data.login.trim(), $options: 'i' };

  Developer
    .find(filters)
    .countDocuments()
    .then(count => callback(null, count))
    .catch(_ => callback('database_error'));
};

DeveloperSchema.statics.findDeveloperByIdAndFormat = function (id, callback) {
  const Developer = this;

  if (!id || !toMongoId(id))
    return callback('bad_request');

  Developer.findById(toMongoId(id), (err, developer) => {
    if (err) return callback('database_error');
    if (!developer) return callback('document_not_found');

    formatDeveloper(
      developer,
      (err, developer) => callback(err, developer)
    );
  });
};

module.exports = mongoose.model('Developer', DeveloperSchema);
