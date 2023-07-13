// IMPORTANT NOTES!
// This class is a shadow model, should not be directly accessed in any way by a controller. It is managed by CronJob scripts
// There is no type checks etc. on the data, as it is assumed that the data is already validated by the CronJob scripts.
// None of the static functions of the class returns anything but the errors, as this is a closed model.

const async = require('async');
const mongoose = require('mongoose');

const gitAPIRequest = require('../../utils/gitAPIRequest');
const toMongoId = require('../../utils/toMongoId')

const Repository = require('../repository/Repository');

const generateKey = require('./functions/generateKey');

const DUPLICATED_UNIQUE_FIELD_ERROR_CODE = 11000;
const MAX_DATABASE_TEXT_FIELD_LENGTH = 1e4;
const MAX_DATABASE_OBJECT_KEY_COUNT = 1e3;
const MIN_PRIORITY_VALUE = 0;
const TYPE_PRIORITY_MAP = {
  'force_repo_update': 0,
  'keyword_search': 1,
  'language_search': 1,
  'repo_update': 2
};
const TYPE_VALUES = ['force_repo_update', 'keyword_search', 'language_search', 'repo_update'];

const Schema = mongoose.Schema;

const TaskSchema = new Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 1,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  },
  priority: {
    type: Number,
    required: true,
    min: MIN_PRIORITY_VALUE
  },
  type: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  },
  data: {
    type: Object,
    default: {}
  }
});

TaskSchema.statics.createTask = function (data, callback) {
  const Task = this;

  if (!data || typeof data != 'object')
    return callback('bad_request');

  if (!data.type || typeof data.type != 'string' || !TYPE_VALUES.includes(data.type))
    return callback('bad_request');

  if (!data.data || typeof data.data != 'object' || !Object.keys(data.data).length || Object.keys(data.data).length > MAX_DATABASE_OBJECT_KEY_COUNT)
    return callback('bad_request');

  const key = generateKey(data);

  if (!key) return callback('bad_request');

  const task = new Task({
    key,
    priority: TYPE_PRIORITY_MAP[data.type],
    type: data.type,
    data: data.data
  });

  task.save(err => {
    if (err && err.code == DUPLICATED_UNIQUE_FIELD_ERROR_CODE)
      return callback('duplicated_unique_field');
    if (err) return callback(err);

    return callback(null);
  });
};

TaskSchema.statics.performLatestTask = function (callback) {
  const Task = this;

  Task
    .find({})
    .sort({
      priority: -1,
      _id: 1
    })
    .limit(1)
    .then(tasks => {
      if (!tasks || !tasks.length)
        return callback(null);

      const task = tasks[0];

      gitAPIRequest(task.type, task.data, (err, result) => {
        if (err) return callback(err);

        if (task.type == 'force_repo_update' || task.type == 'repo_update') {
          const github_id = task.data.github_id;
          if (!github_id)
            return callback('unknown_error');

          if (!result.success) {
            Repository.findRepositoryByGitHubIdAndDelete(github_id, err => {
              if (err) return callback(err);

              Task.findTaskByIdAndDelete(task._id, err => {
                if (err) return callback(err);

                return callback(null);
              });
            });
          } else {
            if (!result.data) return callback('unknown_error');

            const update = result.data;
            update.is_checked = true;

            Repository.findRepositoryByGitHubIdAndUpdate(github_id, update, err => {
              if (err) return callback(err);

              Task.findTaskByIdAndDelete(task._id, err => {
                if (err) return callback(err);

                return callback(null);
              });
            });
          };
        } else if (task.type == 'keyword_search' || task.type == 'language_search') {
          if (!result.success) return callback('unknown_error');
          if (!result.data) return callback('unknown_error');

          const repositories = result.data;

          if (!repositories) return callback('bad_request');

          async.timesSeries(
            repositories.length,
            (time, next) => {
              const data = repositories[time];

              if (!data) return next('unknown_error');

              if (data.is_checked) data.is_checked = false;

              Repository.createRepository(data, (err, repository) => {
                if (err) return next(err);

                Task.createTask({
                  type: 'repo_update',
                  data: {
                    github_id: repository.github_id,
                    owner_name: data.owner.login,
                    title: repository.title
                  }
                }, err => {
                  if (err) return next(err);

                  return next(null);
                });
              });
            },
            err => {
              if (err) return callback(err);

              Task.findTaskByIdAndDelete(task._id, err => {
                if (err) return callback(err);

                return callback(null);
              });
            }
          );
        } else {
          return callback('unknown_error');
        }
      });
    })
    .catch(_ => callback('database_error'));
};

TaskSchema.statics.findTaskByIdAndDelete = function (id, callback) {
  const Task = this;

  if (!id || !toMongoId(id))
    return callback('bad_request');

  Task.findByIdAndDelete(toMongoId(id), err => {
    if (err) return callback('database_error');

    return callback(null);
  });
};

module.exports = mongoose.model('Task', TaskSchema);
