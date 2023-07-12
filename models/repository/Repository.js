const mongoose = require('mongoose');

const RemovedRepository = require('../removed_repository/RemovedRepository');

const formatOtherURLObject = require('./functions/formatOtherURLObject');
const formatHasObject = require('./functions/formatHasObject');

const DUPLICATED_UNIQUE_FIELD_ERROR_CODE = 11000;
const MAX_DATABASE_ARRAY_FIELD_LENGTH = 1e4;
const MAX_DATABASE_TEXT_FIELD_LENGTH = 1e4;
const MAX_DATABASE_OBJECT_KEY_COUNT = 1e3;

const Schema = mongoose.Schema;

const RepositorySchema = new Schema({
  github_id: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  },
  is_checked: {
    type: Boolean,
    default: false,
    index: true
  },
  latest_update_time: {
    type: Number,
    required: true
  },
  developer_id: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  },
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  },
  url: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  },
  description: {
    description: String,
    default: null,
    trim: true,
    minlength: 1,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  },
  fork: {
    type: Boolean,
    default: false
  },
  other_urls: {
    type: Object,
    default: {}
  },
  homepage: {
    description: String,
    default: null,
    trim: true,
    minlength: 1,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  },
  size: {
    type: Number,
    default: null,
    min: 0
  },
  stargazers_count: {
    type: Number,
    default: null,
    min: 0
  },
  watchers_count: {
    type: Number,
    default: null,
    min: 0
  },
  language: {
    description: String,
    default: null,
    trim: true,
    minlength: 1,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  },
  has: {
    type: Object,
    default: {}
  },
  forks_count: { // !!!!
    type: Number,
    default: null,
    min: 0
  },
  archieved: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  open_issues_count: { // !!!!
    type: Number,
    default: null,
    min: 0
  },
  licence: {
    type: Object,
    default: {}
  },
  allow_forking: {
    type: Boolean,
    default: false
  },
  is_template: {
    type: Boolean,
    default: false
  },
  topics: {
    type: Array,
    default: [],
    maxlength: MAX_DATABASE_ARRAY_FIELD_LENGTH
  },
  watchers: {
    type: Number,
    default: null,
    min: 0
  },
  default_branch: {
    description: String,
    default: null,
    trim: true,
    minlength: 1,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  },
  score: {
    description: String,
    default: null,
    trim: true,
    minlength: 1,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  }
});

RepositorySchema.statics.createRepository = function (data, callback) {
  const Repository = this;

  if (!data || typeof data != 'object')
    return callback('bad_request');

  if (!data.github_id || typeof data.github_id != 'string' || !data.github_id.trim().length || data.github_id.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');

  if (!data.title || typeof data.title != 'string' || !data.title.trim().length || data.title.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');

  if (!data.developer_id || typeof data.developer_id != 'string' || !data.developer_id.trim().length || data.developer_id.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');

  if (!data.url || typeof data.url != 'string' || !data.url.trim().length || data.url.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');

  RemovedRepository.findRemovedRepositoryByGitHubId(data.github_id.trim(), (err, removed_repository) => {
    if (err && err != 'document_not_found')
      return callback(err);
    if (!err) return callback('document_already_exists');
    
    const newRepositoryData = {
      github_id: data.github_id.trim(),
      is_checked: 'is_checked' in data && typeof data.is_checked == 'boolean' ? data.is_checked : false,
      latest_update_time: Date.now(),
      developer_id: data.developer_id.trim(),
      title: data.title.trim(),
      url: data.url.trim(),
      description: data.description && typeof data.description == 'string' && data.description.trim().length && data.description.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH ? data.description.trim() : null,
      fork: 'fork' in data && typeof data.fork == 'boolean' ? data.fork : false,
      other_urls: formatOtherURLObject(data),
      homepage: data.homepage && typeof data.homepage == 'string' && data.homepage.trim().length && data.homepage.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH ? data.homepage.trim() : null,
      size: data.size && typeof data.size == 'number' && data.size >= 0 ? data.size : null,
      stargazers_count: data.stargazers_count && typeof data.stargazers_count == 'number' && data.stargazers_count >= 0 ? data.stargazers_count : null,
      watchers_count: data.watchers_count && typeof data.watchers_count == 'number' && data.watchers_count >= 0 ? data.watchers_count : null,
      language: data.language && typeof data.language == 'string' && data.language.trim().length && data.language.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH ? data.language.trim() : null,
      has: formatHasObject(data),
      forks_count: data.forks_count && typeof data.forks_count == 'number' && data.forks_count >= 0 ? data.forks_count : null,
      archieved: 'archieved' in data && typeof data.archieved == 'boolean' ? data.archieved : false,
      disabled: 'disabled' in data && typeof data.disabled == 'boolean' ? data.disabled : false,
      open_issues_count: data.open_issues_count && typeof data.open_issues_count == 'number' && data.open_issues_count >= 0 ? data.open_issues_count : null,
      licence: data.licence && typeof data.licence == 'object' && Object.keys(data.licence).length && Object.keys(data.licence).length < MAX_DATABASE_OBJECT_KEY_COUNT ? data.licence : {},
      allow_forking: 'allow_forking' in data && typeof data.allow_forking == 'boolean' ? data.allow_forking : false,
      is_template: 'is_template' in data && typeof data.is_template == 'boolean' ? data.is_template : false,
      topics: data.topics && Array.isArray(data.topics) && data.topics.length && data.topics.length < MAX_DATABASE_ARRAY_FIELD_LENGTH && !data.topics.find(any => !any || typeof any != 'string' || !any.trim().length || any.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH) ? data.topics : [],
      watchers: data.watchers && typeof data.watchers == 'number' && data.watchers >= 0 ? data.watchers : null,
      default_branch: data.default_branch && typeof data.default_branch == 'string' && data.default_branch.trim().length && data.default_branch.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH ? data.default_branch.trim() : null,
      score: data.score && typeof data.score == 'string' && data.score.trim().length && data.score.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH ? data.score.trim() : null
    };
  
    const newRepository = new Repository(newRepositoryData);
  
    newRepository.save((err, repository) => {
      if (err && err.code == DUPLICATED_UNIQUE_FIELD_ERROR_CODE)
        return callback('duplicated_unique_field');
      if (err)
        return callback('database_error');
  
      return callback(null, repository);
    });
  });
};

RepositorySchema.statics.findRepositoryByGitHubIdAndUpdate = function (github_id, data, callback) {
  const Repository = this;

  if (!github_id || typeof github_id != 'string' || !github_id.trim().length || github_id.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');

  if (!data || typeof data != 'object')
    return callback('bad_request');

  const update = {};

  if ('is_checked' in data && typeof data.is_checked == 'boolean')
    update.is_checked = data.is_checked;
  if ('developer_id' in data && typeof data.developer_id == 'string' && data.developer_id.trim().length && data.developer_id.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
    update.developer_id = data.developer_id.trim();
  if ('title' in data && typeof data.title == 'string' && data.title.trim().length && data.title.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
    update.title = data.title.trim();
  if ('url' in data && typeof data.url == 'string' && data.url.trim().length && data.url.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
    update.url = data.url.trim();
  if ('description' in data && typeof data.description == 'string' && data.description.trim().length && data.description.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
    update.description = data.description.trim();
  if ('fork' in data && typeof data.fork == 'boolean')
    update.fork = data.fork;
  const otherURLs = formatOtherURLObject(data);
  Object.keys(otherURLs).forEach(key => {
    update[`other_urls.${key}`] = otherURLs[key];
  });
  if ('homepage' in data && typeof data.homepage == 'string' && data.homepage.trim().length && data.homepage.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
    update.homepage = data.homepage.trim();
  if ('size' in data && typeof data.size == 'number' && data.size >= 0)
    update.size = data.size;
  if ('stargazers_count' in data && typeof data.stargazers_count == 'number' && data.stargazers_count >= 0)
    update.stargazers_count = data.stargazers_count;
  if ('watchers_count' in data && typeof data.watchers_count == 'number' && data.watchers_count >= 0)
    update.watchers_count = data.watchers_count;
  if ('language' in data && typeof data.language == 'string' && data.language.trim().length && data.language.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
    update.language = data.language.trim();
  const has = formatHasObject(data);
  Object.keys(has).forEach(key => {
    update[`has.${key}`] = has[key];
  });
  if ('forks_count' in data && typeof data.forks_count == 'number' && data.forks_count >= 0)
    update.forks_count = data.forks_count;
  if ('archieved' in data && typeof data.archieved == 'boolean')
    update.archieved = data.archieved;
  if ('disabled' in data && typeof data.disabled == 'boolean')
    update.disabled = data.disabled;
  if ('open_issues_count' in data && typeof data.open_issues_count == 'number' && data.open_issues_count >= 0)
    update.open_issues_count = data.open_issues_count;
  if ('licence' in data && typeof data.licence == 'object' && Object.keys(data.licence).length && Object.keys(data.licence).length < MAX_DATABASE_OBJECT_KEY_COUNT)
    update.licence = data.licence;
  if ('allow_forking' in data && typeof data.allow_forking == 'boolean')
    update.allow_forking = data.allow_forking;
  if ('is_template' in data && typeof data.is_template == 'boolean')
    update.is_template = data.is_template;
  if ('topics' in data && Array.isArray(data.topics) && data.topics.length && data.topics.length < MAX_DATABASE_ARRAY_FIELD_LENGTH && !data.topics.find(any => !any || typeof any != 'string' || !any.trim().length || any.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH))
    update.topics = data.topics;
  if ('watchers' in data && typeof data.watchers == 'number' && data.watchers >= 0)
    update.watchers = data.watchers;
  if ('default_branch' in data && typeof data.default_branch == 'string' && data.default_branch.trim().length && data.default_branch.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
    update.default_branch = data.default_branch.trim();
  if ('score' in data && typeof data.score == 'string' && data.score.trim().length && data.score.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
    update.score = data.score.trim();

  if (!Object.keys(update).length)
    return callback('bad_request');

  update.latest_update_time = Date.now();

  Repository.findOneAndUpdate({
    github_id: github_id.trim()
  }, {$set: update}, { new: true }, (err, repository) => {
    if (err) return callback('database_error');

    return callback(null, repository);
  });
};

RepositorySchema.statics.findRepositoryByGitHubIdAndDelete = function (github_id, callback) {
  const Repository = this;

  if (!github_id || typeof github_id != 'string' || !github_id.trim().length || github_id.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');
  
  Repository.findOneAndDelete({
    github_id: github_id.trim()
  }, (err, repository) => {
    if (err) return callback('database_error');
    if (!repository) return callback('document_not_found');

    RemovedRepository.createRemovedRepository({
      github_id: repository.github_id
    }, (err, _) => {
      if (err) return callback(err);

      return callback(null, repository);
    });
  });
};

module.exports = mongoose.model('Repository', RepositorySchema);
