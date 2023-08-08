const async = require('async');
const mongoose = require('mongoose');

const toMongoId = require('../../utils/toMongoId');

const Developer = require('../developer/Developer');
const RemovedRepository = require('../removed_repository/RemovedRepository');

const formatOtherURLObject = require('./functions/formatOtherURLObject');
const formatHasObject = require('./functions/formatHasObject');
const formatRepository = require('./functions/formatRepository');

const DEFAULT_DOCUMENT_COUNT_PER_QUERY = 20;
const DUPLICATED_UNIQUE_FIELD_ERROR_CODE = 11000;
const MAX_DATABASE_ARRAY_FIELD_LENGTH = 1e4;
const MAX_DATABASE_TEXT_FIELD_LENGTH = 1e4;
const MAX_DATABASE_OBJECT_KEY_COUNT = 1e3;
const MAX_DOCUMENT_COUNT_PER_QUERY = 1e2;
const SORT_VALUES = ['created_at', 'title', 'pushed_at'];

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
    type: mongoose.Types.ObjectId,
    default: null,
    index: true
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
    type: String,
    default: null,
    trim: true,
    minlength: 1,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  },
  created_at: {
    type: Date,
    default: null
  },
  pushed_at: {
    type: Date,
    default: null
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
    type: String,
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
    type: String,
    default: null,
    trim: true,
    minlength: 1,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  },
  has: {
    type: Object,
    default: {}
  },
  forks_count: {
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
  open_issues_count: {
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
    type: String,
    default: null,
    trim: true,
    minlength: 1,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  },
  score: {
    type: String,
    default: null,
    trim: true,
    minlength: 1,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  }
});

RepositorySchema.statics.createOrUpdateRepository = function (data, callback) {
  const Repository = this;

  if (!data || typeof data != 'object')
    return callback('bad_request');

  if (!data.github_id || typeof data.github_id != 'string' || !data.github_id.trim().length || data.github_id.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');

  if (!data.title || typeof data.title != 'string' || !data.title.trim().length || data.title.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');

  if (!data.url || typeof data.url != 'string' || !data.url.trim().length || data.url.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');

  RemovedRepository.findRemovedRepositoryByGitHubId(data.github_id.trim(), (err, removed_repository) => {
    if (err && err != 'document_not_found')
      return callback(err);
    if (!err && removed_repository) return callback('document_already_exists');

    if (data.is_checked) {
      Developer.createOrUpdateDeveloper(data.owner, (err, developer) => {
        if (err) return callback(err);

        const newRepository = new Repository({
          github_id: data.github_id.trim(),
          is_checked: true,
          latest_update_time: Date.now(),
          developer_id: developer._id,
          title: data.title.trim(),
          url: data.url.trim(),
          description: data.description && typeof data.description == 'string' && data.description.trim().length && data.description.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH ? data.description.trim() : null,
          created_at: new Date(data.created_at),
          pushed_at: new Date(data.pushed_at),
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
        });

        newRepository.save((err, repository) => {
          if (err && err.code == DUPLICATED_UNIQUE_FIELD_ERROR_CODE) {
            Repository.findRepositoryByGitHubIdAndUpdate(data.github_id.trim(), data, err => {
              if (err) return callback(err);

              return callback('duplicated_unique_field');
            });
          } else {
            if (err) return callback('database_error');

            return callback(null, repository);
          }
        });
      });
    } else {
      const newRepository = new Repository({
        github_id: data.github_id.trim(),
        is_checked: false,
        latest_update_time: Date.now(),
        title: data.title.trim(),
        url: data.url.trim()
      });

      newRepository.save((err, repository) => {
        if (err && err.code == DUPLICATED_UNIQUE_FIELD_ERROR_CODE) {
          Repository.findRepositoryByGitHubIdAndUpdate(data.github_id.trim(), data, err => {
            if (err) return callback(err);

            return callback('duplicated_unique_field');
          });
        } else {
          if (err) return callback('database_error');

          return callback(null, repository);
        }
      });
    };
  });
};

RepositorySchema.statics.findRepositoryByGitHubIdAndUpdate = function (github_id, data, callback) {
  const Repository = this;

  if (!github_id || typeof github_id != 'string' || !github_id.trim().length || github_id.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');

  if (!data || typeof data != 'object')
    return callback('bad_request');

  if (data.is_checked) {
    Developer.createOrUpdateDeveloper(data.owner, (err, developer) => {
      if (err) return callback(err);

      const update = {
        developer_id: developer._id,
        is_checked: true
      };

      if ('title' in data && typeof data.title == 'string' && data.title.trim().length && data.title.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
        update.title = data.title.trim();
      if ('url' in data && typeof data.url == 'string' && data.url.trim().length && data.url.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
        update.url = data.url.trim();
      if ('description' in data && typeof data.description == 'string' && data.description.trim().length && data.description.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
        update.description = data.description.trim();
      if ('created_at' in data && typeof data.created_at == 'string' && !isNaN(new Date(data.created_at)))
        update.created_at = new Date(data.created_at);
      if ('pushed_at' in data && typeof data.pushed_at == 'string' && !isNaN(new Date(data.pushed_at)))
        update.pushed_at = new Date(data.pushed_at);
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

      update.latest_update_time = Date.now();

      Repository.findOneAndUpdate({
        github_id: github_id.trim()
      }, { $set: update }, { new: true }, (err, repository) => {
        if (err) return callback('database_error');
        if (!repository) return callback('document_not_found');

        return callback(null, repository);
      });
    });
  } else {
    const update = {};

    if ('title' in data && typeof data.title == 'string' && data.title.trim().length && data.title.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
      update.title = data.title.trim();
    if ('url' in data && typeof data.url == 'string' && data.url.trim().length && data.url.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
      update.url = data.url.trim();

    update.latest_update_time = Date.now();

    Repository.findOneAndUpdate({
      github_id: github_id.trim()
    }, { $set: update }, { new: true }, (err, repository) => {
      if (err) return callback('database_error');
      if (!repository) return callback('document_not_found');

      return callback(null, repository);
    });
  };
};

RepositorySchema.statics.findRepositoryByGitHubIdAndDelete = function (github_id, callback) {
  const Repository = this;

  if (!github_id || typeof github_id != 'string' || !github_id.trim().length || github_id.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');

  Repository.findOneAndDelete({
    github_id: github_id.trim()
  }, (err, repository) => {
    if (err) return callback('database_error');
    if (!repository) return callback(null);

    RemovedRepository.createRemovedRepository({
      github_id: repository.github_id
    }, (err, _) => {
      if (err) return callback(err);

      return callback(null, repository);
    });
  });
};

RepositorySchema.statics.findRepositoryByGitHubIdAndCompletelyDelete = function (github_id, callback) {
  const Repository = this;

  if (!github_id || typeof github_id != 'string' || !github_id.trim().length || github_id.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');

  Repository.findOneAndDelete({
    github_id: github_id.trim()
  }, (err, repository) => {
    if (err) return callback('database_error');
    if (!repository) return callback(null);

    return callback(null, repository);
  });
};

RepositorySchema.statics.findRepositoriesByFilters = function (data, callback) {
  const Repository = this;

  if (!data || typeof data != 'object')
    return callback('bad_request');

  const filters = {
    is_checked: true
  };

  let search = null;
  if (data.search && typeof data.search == 'string' && data.search.trim().length && data.search.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH) {
    search = data.search.trim();
    filters.$or = [
      { title: { $regex: data.search.trim(), $options: 'i' } }
    ];
  };

  const limit = data.limit && !isNaN(parseInt(data.limit)) && parseInt(data.limit) > 0 && parseInt(data.limit) < MAX_DOCUMENT_COUNT_PER_QUERY ? parseInt(data.limit) : DEFAULT_DOCUMENT_COUNT_PER_QUERY;
  const page = data.page && !isNaN(parseInt(data.page)) && parseInt(data.page) > 0 ? parseInt(data.page) : 0;
  const skip = page * limit;

  if (data.title && typeof data.title == 'string' && data.title.trim().length && data.title.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
    filters.title = { $regex: data.title.trim(), $options: 'i' };

  if (data.description && typeof data.description == 'string' && data.description.trim().length && data.description.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
    filters.description = { $regex: data.description.trim(), $options: 'i' };

  if ('fork' in data && typeof data.fork == 'string' && data.fork == 'true' || data.fork == 'false')
    filters.fork = data.fork;

  if (data.language && typeof data.language == 'string' && data.language.trim().length && data.language.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
    filters.language = { $regex: data.language.trim(), $options: 'i' };

  if (data.created_after && typeof data.created_after == 'string' && !isNaN(new Date(data.created_after)))
    filters.created_at = { $gte: new Date(data.created_after) };

  if (data.created_before && typeof data.created_before == 'string' && !isNaN(new Date(data.created_before)))
    filters.created_at = { $lte: new Date(data.created_before) };

  if (data.pushed_after && typeof data.pushed_after == 'string' && !isNaN(new Date(data.pushed_after)))
    filters.pushed_at = { $gte: new Date(data.pushed_after) };

  if (data.pushed_before && typeof data.pushed_before == 'string' && !isNaN(new Date(data.pushed_before)))
    filters.pushed_at = { $lte: new Date(data.pushed_before) };

  const sort_order = 'sort_order' in data && data.sort_order == -1 ? -1 : 1;
  let sort = { _id: sort_order };

  if (data.sort && typeof data.sort == 'string' && SORT_VALUES.includes(data.sort))
    sort = { [data.sort]: sort_order };

  Repository
    .find(filters)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .then(repositories => async.timesSeries(
      repositories.length,
      (time, next) => formatRepository(repositories[time], (err, repository) => next(err, repository)),
      (err, repositories) => callback(err, {
        search,
        repositories,
        filters,
        limit,
        page,
        sort,
        sort_order
      })
    ))
    .catch(_ => callback('database_error'));
};

RepositorySchema.statics.findRepositoryCountByFilters = function (data, callback) {
  const Repository = this;

  if (!data || typeof data != 'object')
    return callback('bad_request');

  const filters = {
    is_checked: true
  };

  if (data.search && typeof data.search == 'string' && data.search.trim().length && data.search.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
    filters.$or = [
      { title: { $regex: data.search.trim(), $options: 'i' } }
    ];

  if (data.title && typeof data.title == 'string' && data.title.trim().length && data.title.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
    filters.title = { $regex: data.title.trim(), $options: 'i' };

  if (data.description && typeof data.description == 'string' && data.description.trim().length && data.description.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
    filters.description = { $regex: data.description.trim(), $options: 'i' };

  if ('fork' in data && typeof data.fork == 'boolean')
    filters.fork = data.fork;

  if (data.language && typeof data.language == 'string' && data.language.trim().length && data.language.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
    filters.language = { $regex: data.language.trim(), $options: 'i' };

  if (data.created_after && typeof data.created_after == 'string' && !isNaN(new Date(data.created_after)))
    filters.created_at = { $gte: new Date(data.created_after) };

  if (data.created_before && typeof data.created_before == 'string' && !isNaN(new Date(data.created_before)))
    filters.created_at = { $lte: new Date(data.created_before) };

  if (data.pushed_after && typeof data.pushed_after == 'string' && !isNaN(new Date(data.pushed_after)))
    filters.pushed_at = { $gte: new Date(data.pushed_after) };

  if (data.pushed_before && typeof data.pushed_before == 'string' && !isNaN(new Date(data.pushed_before)))
    filters.pushed_at = { $lte: new Date(data.pushed_before) };

  Repository
    .find(filters)
    .countDocuments()
    .then(count => callback(null, count))
    .catch(_ => callback('database_error'));
};

RepositorySchema.statics.findRepositoryByIdAndFormat = function (id, callback) {
  const Repository = this;

  if (!id || !toMongoId(id))
    return callback('bad_request');

  Repository.findById(toMongoId(id), (err, repository) => {
    if (err) return callback('database_error');
    if (!repository) return callback('document_not_found');

    if (repository.latest_update_time)

      formatRepository(repository, (err, repository) => {
        if (err) return callback(err);

        Developer.findDeveloperByIdAndFormat(repository.developer_id, (err, developer) => {
          if (err) return callback(err);

          repository.developer = developer;

          return callback(null, repository);
        });
      });
  });
};

RepositorySchema.statics.findLastUpdatedRepositoryByDeveloperId = function (developer_id, callback) {
  const Repository = this;

  if (!developer_id || !toMongoId(developer_id))
    return callback('bad_request');

  Repository
    .find({ developer_id: toMongoId(developer_id) })
    .sort({ latest_update_time: 1 })
    .limit(1)
    .then(repositories => {
      if (!repositories.length)
        return callback('document_not_found');

      return callback(null, repositories[0]);
    })
    .catch(_ => callback('database_error'));
};

module.exports = mongoose.model('Repository', RepositorySchema);
