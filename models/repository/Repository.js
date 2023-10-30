const async = require('async');
const mongoose = require('mongoose');

const generateMonthString = require('../../utils/generateMonthString');
const getMonthLength = require('../../utils/getMonthLength');
const toMongoId = require('../../utils/toMongoId');

const RepositoryAnalytics = require('../repository_analytics/RepositoryAnalytics');
const Developer = require('../developer/Developer');

const formatRepository = require('./functions/formatRepository');

const DEFAULT_DOCUMENT_COUNT_PER_QUERY = 20;
const DUPLICATED_UNIQUE_FIELD_ERROR_CODE = 11000;
const MAX_DATABASE_TEXT_FIELD_LENGTH = 1e4;
const MAX_DOCUMENT_COUNT_PER_QUERY = 1e2;
const SORT_VALUES = ['created_at', 'title_lower', 'last_pushed_at'];

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
  last_update_time: {
    type: Number,
    required: true
  },
  developer_id: {
    type: mongoose.Types.ObjectId,
    default: null,
    index: true
  },
  url: {
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
  title_lower: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH,
  },
  description: {
    type: String,
    default: null,
    trim: true,
    minlength: 1,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  },
  found_at: {
    type: Date,
    required: true,
  },
  created_at: {
    type: Date,
    default: null
  },
  last_pushed_at: {
    type: Date,
    default: null
  },
  default_branch: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  },
  commit_count: {
    type: Number,
    default: 0
  }
});

RepositorySchema.statics.findRepositoryByGitHubId = function (github_id, callback) {
  const Repository = this;

  if (!github_id || typeof github_id != 'string' || !github_id.trim().length || github_id.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');

  Repository.findOne({
    github_id: github_id.trim()
  }, (err, repository) => {
    if (err) return callback('database_error');
    if (!repository) return callback('document_not_found');

    return callback(null, repository);
  });
};

RepositorySchema.statics.createRepository = function(data, callback) {
  const Repository = this;

  if (!data || typeof data != 'object')
    return callback('bad_request');

  if (!data.github_id || typeof data.github_id != 'string' || !data.github_id.trim().length || data.github_id.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');

  if (!data.url || typeof data.url != 'string' || !data.url.trim().length || data.url.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');

  if (!data.title || typeof data.title != 'string' || !data.title.trim().length || data.title.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');

  if (!data.description || typeof data.description != 'string' || !data.description.trim().length || data.description.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');

  if (!data.created_at || !isNaN(new Date(data.created_at)))
    return callback('bad_request');

  if (!data.last_pushed_at || !isNaN(new Date(data.last_pushed_at)))
    return callback('bad_request');

  if (!data.default_branch || typeof data.default_branch != 'string' || !data.default_branch.trim().length || data.default_branch.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');

  if (!data.commit_date || isNaN(new Date(data.commit_date)))
    return callback('bad_request');

  if (!data.owner || typeof data.owner != 'object')
    return callback('bad_request');

  Developer.createOrUpdateDeveloper(data.owner, (err, developer, is_new_developer) => {
    if (err) return callback(err);

    const newRepository = new Repository({
      github_id: data.github_id.trim(),
      last_update_time: Date.now(),
      developer_id: developer._id,
      url: data.url.trim(),
      title: data.title.trim(),
      title_lower: data.title.trim().toLowerCase(),
      description: data.description.trim(),
      found_at: new Date(),
      created_at: new Date(data.created_at),
      last_pushed_at: new Date(data.last_pushed_at),
      default_branch: data.default_branch.trim(),
      commit_count: 1
    });

    newRepository.save((err, repository) => {
      if (err && err.code == DUPLICATED_UNIQUE_FIELD_ERROR_CODE)
        return callback('duplicated_unique_field');
      if (err) return callback(err);
      
      RepositoryAnalytics.pushNewCommitToAnalytics({
        developer_id: developer._id,
        repository_id: repository._id,
        commit_date: new Date(data.commit_date),
        is_new_repository: true,
        is_new_developer
      }, err => {
        if (err) return callback(err);

        return callback(null, repository);
      });
    });
  });
};

RepositorySchema.statics.findRepositoryByGitHubIdAndUpdate = function (github_id, data, callback) {
  const Repository = this;

  if (!github_id || typeof github_id != 'string' || !github_id.trim().length || github_id.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');

  if (!data || typeof data != 'object')
    return callback('bad_request');

  if (!data.url || typeof data.url != 'string' || !data.url.trim().length || data.url.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');

  if (!data.title || typeof data.title != 'string' || !data.title.trim().length || data.title.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');

  if (!data.description || typeof data.description != 'string' || !data.description.trim().length || data.description.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');

  if (!data.last_pushed_at || !isNaN(new Date(data.last_pushed_at)))
    return callback('bad_request');

  if (!data.default_branch || typeof data.default_branch != 'string' || !data.default_branch.trim().length || data.default_branch.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');

  if (!data.commit_date || isNaN(new Date(data.commit_date)))
    return callback('bad_request');

  if (!data.owner || typeof data.owner != 'object')
    return callback('bad_request');

  Developer.findDeveloperByGitHubIdAndUpdate(data.owner.github_id, {
    login: data.owner.login
  }, (err, developer) => {
    if (err) return callback(err);

    Repository.findOneAndUpdate({
      github_id: github_id.trim()
    }, {
      $set: {
        last_update_time: Date.now(),
        url: data.url.trim(),
        title: data.title.trim(),
        title_lower: data.title.trim().toLowerCase(),
        description: data.description.trim(),
        last_pushed_at: new Date(data.last_pushed_at),
        default_branch: data.default_branch.trim()
      },
      $inc: {
        commit_count: 1
      }
    }, { new: true }, (err, repository) => {
      if (err) return callback('database_error');
      if (!repository) return callback('document_not_found');
  
      RepositoryAnalytics.pushNewCommitToAnalytics({
        developer_id: developer._id,
        repository_id: repository._id,
        commit_date: new Date(data.commit_date),
        is_new_repository: false,
        is_new_developer: false
      }, err => {
        if (err) return callback(err);

        return callback(null, repository);
      });
    });
  });
};

RepositorySchema.statics.getRepositoryAnalyticsForAMonth = function (_month, callback) {
  const Repository = this;

  if (!_month || isNaN(new Date(_month)))
    return callback('bad_request');

  const month = (new Date(_month)).getMonth();
  const month_length = getMonthLength(month);

  RepositoryAnalytics.getAnalyticsForAMonth(_month, (err, repository_analytics) => {
    if (err) return callback(err);

    Repository.find({
      _id: { $in: repository_analytics.daily_commited_repository_list.flat() }
    }, (err, repositories) => {
      if (err) return callback('database_error');

      const daily_new_repository_list = new Array(month_length).fill([]);
      const daily_commited_repository_list = new Array(month_length).fill([]);

      async.timesSeries(
        repositories.length,
        (time, next) => {
          formatRepository(repositories[time], (err, repository) => {
            if (err) return next(err);

            if (repository.found_at.getMonth() == month)
              daily_new_repository_list[repository.found_at.getDate() - 1].push(repository);

            repository_analytics.daily_commited_repository_list.forEach((day, index) => {
              day.forEach(repository_id => {
                if (repository_id.toString() == repository._id.toString())
                  daily_commited_repository_list[index - 1].push(repository);
              });
            });
          });
        },
        err => {
          if (err) return callback(err);

          return callback(null, {
            total_new_repository_count: repository_analytics.total_new_repository_count,
            total_full_time_repository_count: repository_analytics.total_full_time_repository_count,
            total_commit_count: repository_analytics.total_commit_count,
            total_unique_commit_count: repository_analytics.total_unique_commit_count,
            total_day_with_commit_count: repository_analytics.total_day_with_commit_count,
            daily_new_repository_list,
            daily_commited_repository_list
          });
        }
      );
    });
  });
};

RepositorySchema.statics.findRepositoryByIdAndFormat = function (id, callback) {
  const Repository = this;

  if (!id || !toMongoId(id))
    return callback('bad_request');

  Repository.findById(toMongoId(id), (err, repository) => {
    if (err) return callback('database_error');
    if (!repository) return callback('document_not_found');

    if (repository.last_update_time)

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

  if (data.title_lower && typeof data.title_lower == 'string' && data.title_lower.trim().length && data.title_lower.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
    filters.title = { $regex: data.title_lower.trim().toLowerCase(), $options: 'i' };

  if (data.description && typeof data.description == 'string' && data.description.trim().length && data.description.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
    filters.description = { $regex: data.description.trim(), $options: 'i' };

  if (data.created_after && typeof data.created_after == 'string' && !isNaN(new Date(data.created_after)))
    filters.created_at = { $gte: new Date(data.created_after) };

  if (data.created_before && typeof data.created_before == 'string' && !isNaN(new Date(data.created_before)))
    filters.created_at = { $lte: new Date(data.created_before) };

  if (data.pushed_after && typeof data.pushed_after == 'string' && !isNaN(new Date(data.pushed_after)))
    filters.last_pushed_at = { $gte: new Date(data.pushed_after) };

  if (data.pushed_before && typeof data.pushed_before == 'string' && !isNaN(new Date(data.pushed_before)))
    filters.last_pushed_at = { $lte: new Date(data.pushed_before) };

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

  if (data.created_after && typeof data.created_after == 'string' && !isNaN(new Date(data.created_after)))
    filters.created_at = { $gte: new Date(data.created_after) };

  if (data.created_before && typeof data.created_before == 'string' && !isNaN(new Date(data.created_before)))
    filters.created_at = { $lte: new Date(data.created_before) };

  if (data.pushed_after && typeof data.pushed_after == 'string' && !isNaN(new Date(data.pushed_after)))
    filters.last_pushed_at = { $gte: new Date(data.pushed_after) };

  if (data.pushed_before && typeof data.pushed_before == 'string' && !isNaN(new Date(data.pushed_before)))
    filters.last_pushed_at = { $lte: new Date(data.pushed_before) };

  Repository
    .find(filters)
    .countDocuments()
    .then(count => callback(null, count))
    .catch(_ => callback('database_error'));
};

module.exports = mongoose.model('Repository', RepositorySchema);
