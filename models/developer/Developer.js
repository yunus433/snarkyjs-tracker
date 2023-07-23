const mongoose = require('mongoose');

const formatOtherURLObject = require('./functions/formatOtherURLObject');

const DUPLICATED_UNIQUE_FIELD_ERROR_CODE = 11000;
const MAX_DATABASE_TEXT_FIELD_LENGTH = 1e4;

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
    login: data.login.trim(),
    node_id: data.node_id && typeof data.node_id == 'string' && data.node_id.trim().length && data.node_id.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH ? data.node_id.trim() : null,
    avatar_url: data.avatar_url && typeof data.avatar_url == 'string' && data.avatar_url.trim().length && data.avatar_url.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH ? data.avatar_url.trim() : null,
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

  const update = {};

  if ('login' in data && typeof data.login == 'string' && data.login.trim().length && data.login.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
    update.login = data.login.trim();
  if ('node_id' in data && typeof data.node_id == 'string' && data.node_id.trim().length && data.node_id.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
    update.node_id = data.node_id.trim();
  if ('avatar_url' in data && typeof data.avatar_url == 'string' && data.avatar_url.trim().length && data.avatar_url.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
    update.avatar_url = data.avatar_url.trim();
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

module.exports = mongoose.model('Developer', DeveloperSchema);
