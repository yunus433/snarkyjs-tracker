const mongoose = require('mongoose');

const toMongoId = require('../../utils/toMongoId');

const formatDeveloper = require('./functions/formatDeveloper');
const formatOtherURLObject = require('./functions/formatOtherURLObject');

const DEFAULT_DOCUMENT_COUNT_PER_QUERY = 20;
const DUPLICATED_UNIQUE_FIELD_ERROR_CODE = 11000;
const MAX_DATABASE_TEXT_FIELD_LENGTH = 1e4;
const MAX_DOCUMENT_COUNT_PER_QUERY = 1e2;
const SORT_VALUES = ['login'];

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
  latest_update_time: {
    type: Number,
    required: true
  },
  login: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 1,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  },
  node_id: {
    type: String,
    default: null,
    trim: true,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  },
  avatar_url: {
    type: String,
    default: null,
    trim: true,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  },
  gravatar_id: {
    type: String,
    default: null,
    trim: true,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  },
  url: {
    type: String,
    default: null,
    trim: true,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  },
  other_urls: {
    type: Object,
    default: {}
  },
  type: {
    type: String,
    default: null,
    trim: true,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  },
  site_admin: {
    type: Boolean,
    default: false
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
    node_id: data.node_id && typeof data.node_id == 'string' && data.node_id.trim().length && data.node_id.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH ? data.node_id.trim() : null,
    avatar_url: data.avatar_url && typeof data.avatar_url == 'string' && data.avatar_url.trim().length && data.avatar_url.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH ? data.avatar_url.trim() : null,
    gravatar_id: data.gravatar_id && typeof data.gravatar_id == 'string' && data.gravatar_id.trim().length && data.gravatar_id.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH ? data.gravatar_id.trim() : null,
    url: data.url && typeof data.url == 'string' && data.url.trim().length && data.url.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH ? data.url.trim() : null,
    other_urls: formatOtherURLObject(data),
    type: data.type && typeof data.type == 'string' && data.type.trim().length && data.type.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH ? data.type.trim() : null,
    site_admin: data.site_admin && typeof data.site_admin == 'boolean' ? data.site_admin : false
  });

  newDeveloper.save((err, developer) => {
    if (err && err.code == DUPLICATED_UNIQUE_FIELD_ERROR_CODE) {
      Developer.findDeveloperByGitHubIdAndUpdate(data.github_id.trim(), data, (err, developer) => {
        if (err) return callback(err);

        return callback(null, developer);
      });
    } else {
      if (err) return callback('database_error');

      return callback(null, developer);
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

  if ('login' in data && typeof data.login == 'string' && data.login.trim().length && data.login.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
    update.login = data.login.trim();
  if ('node_id' in data && typeof data.node_id == 'string' && data.node_id.trim().length && data.node_id.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
    update.node_id = data.node_id.trim();
  if ('avatar_url' in data && typeof data.avatar_url == 'string' && data.avatar_url.trim().length && data.avatar_url.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
    update.avatar_url = data.avatar_url.trim();
  if ('gravatar_id' in data && typeof data.gravatar_id == 'string' && data.gravatar_id.trim().length && data.gravatar_id.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
    update.gravatar_id = data.gravatar_id.trim();
  if ('url' in data && typeof data.url == 'string' && data.url.trim().length && data.url.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
    update.url = data.url.trim();
  const otherURLs = formatOtherURLObject(data);
  Object.keys(otherURLs).forEach(key => {
    update[`other_urls.${key}`] = otherURLs[key];
  });
  if ('type' in data && typeof data.type == 'string' && data.type.trim().length && data.type.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
    update.type = data.type.trim();
  if ('site_admin' in data && typeof data.site_admin == 'boolean')
    update.site_admin = data.site_admin;

  Developer.findOneAndUpdate({
    github_id: github_id.trim()
  }, { $set: update }, { new: true }, (err, developer) => {
    if (err) return callback('database_error');
    if (!developer) return callback('document_not_found');

    return callback(null, developer);
  });
};

DeveloperSchema.statics.findDeveloperByGitHubIdAndDelete = function (github_id, callback) {
  const Developer = this;

  if (!github_id || typeof github_id != 'string' || !github_id.trim().length || github_id.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');
  
  Developer.findOneAndDelete({
    github_id: github_id.trim()
  }, (err, developer) => {
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

  const limit = data.limit && !isNaN(parseInt(data.limit)) && parseInt(data.limit) > 0 && parseInt(data.limit) < MAX_DOCUMENT_COUNT_PER_QUERY ? parseInt(data.limit) : DEFAULT_DOCUMENT_COUNT_PER_QUERY;
  const page = data.page && !isNaN(parseInt(data.page)) && parseInt(data.page) > 0 ? parseInt(data.page) : 0;
  const skip = page * limit;

  if (data.login && typeof data.login == 'string' && data.login.trim().length && data.login.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
    filters.login = { $regex: data.login.trim(), $options: 'i' };

  const sort_order = data.sort_order && data.sort_order == 1 ? 1 : -1;
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
