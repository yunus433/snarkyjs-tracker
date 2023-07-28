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
const MAX_DOCUMENT_COUNT_PER_QUERY = 10;
const MIN_PRIORITY_VALUE = 0;
const BACKLOG_FINISH_TIME = 12 * 60 * 60 * 1000;
const STATUS_CODES = {
  indexing: 0,
  not_snarkyjs: 1,
  snarkyjs: 2
};
const TYPE_PRIORITY_MAP = {
  'force_repo_update': 0,
  'repo_update': 1,
  'keyword_search': 2,
  'language_search': 2
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
  },
  backlog: {
    type: Number,
    default: null,
    index: true,
    min: 0
  }
});

TaskSchema.statics.findTaskByIdAndReturnIfPerformed = function (id, callback) {
  const Task = this;

  if (!id || !toMongoId(id))
    return callback('bad_request');

  Task.findById(toMongoId(id), (err, task) => {
    if (err) return callback('database_error');

    if (task) return callback(null, false);
    else return callback(null, true);
  });
};

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

  const newTask = new Task({
    key,
    priority: TYPE_PRIORITY_MAP[data.type],
    type: data.type,
    data: data.data,
    backlog: data.backlog && !isNaN(parseInt(data.backlog)) ? parseInt(data.backlog) : null
  });

  newTask.save((err, task) => {
    if (err && err.code == DUPLICATED_UNIQUE_FIELD_ERROR_CODE)
      return callback('duplicated_unique_field');
    if (err) return callback(err);

    return callback(null, task);
  });
};

TaskSchema.statics.performLatestTask = function (callback) {
  const Task = this;

  Task
    .find({
      backlog: null
    })
    .sort({
      priority: 1,
      type: -1,
      _id: 1
    })
    .limit(1)
    .then(tasks => {
      if (!tasks || !tasks.length)
        return callback(null);

      const task = tasks[0];

      console.log(task.key);

      gitAPIRequest(task.type, task.data, (err, result) => {
        console.log("API request result: ", err, result);

        if (err) {
          if (err == 'document_not_found')
            Task.findTaskByIdAndDelete(task._id, err => {
              if (err) return callback(err);

              return callback(null);
            });
          else
            Task.findTaskByIdAndRecreate(task._id, err => {
              if (err) return callback(err);

              return callback(null);
            });
        } else {
          if (task.type == 'force_repo_update') {
            if (!task.data || !task.data.github_id)
              return callback('unknown_error');

            const github_id = task.data.github_id;

            Repository.findRepositoryByGitHubIdAndUpdate(github_id, task.data, err => {
              if (err) return callback(err);

              Task.findTaskByIdAndDelete(task._id, err => {
                if (err) return callback(err);

                return callback(null);
              });
            });
          } else if (task.type == 'repo_update') {
            if (!task.data || !task.data.github_id)
              return callback('unknown_error');

            const github_id = task.data.github_id;
  
            if (result.status == STATUS_CODES.indexing) {
              Task.findTaskByIdAndRecreate(task._id, err => {
                if (err) return callback(err);
  
                return callback(null);
              });
            } else if (result.status == STATUS_CODES.not_snarkyjs) {
              Repository.findRepositoryByGitHubIdAndDelete(github_id, err => {
                if (err) return callback(err);
  
                Task.findTaskByIdAndDelete(task._id, err => {
                  if (err) return callback(err);
  
                  return callback(null);
                });
              });
            } else if (result.status == STATUS_CODES.snarkyjs) {
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
            if (!result.data || !Array.isArray(result.data))
              return callback('unknown_error');
  
            const repositories = result.data;

            async.timesSeries(
              repositories.length,
              (time, next) => {
                const data = repositories[time];
  
                if (!data) return next('unknown_error');

                data.is_checked = false;

                Repository.createOrUpdateRepository(data, (err, repository) => {
                  if (err && (err == 'document_already_exists' || err == 'duplicated_unique_field'))
                    return next(null);
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

TaskSchema.statics.findTaskByIdAndRecreate = function (id, callback)  {
  const Task = this;

  if (!id || !toMongoId(id))
    return callback('bad_request');

  Task.findByIdAndDelete(toMongoId(id), (err, task) => {
    if (err) return callback('database_error');
    if (!task) return callback('document_not_found');

    Task.createTask({
      type: task.type,
      data: task.data,
      backlog: Date.now() + BACKLOG_FINISH_TIME
    }, (err, task) => callback(err, task));
  });
};

TaskSchema.statics.checkBacklog = function (callback) {
  const Task = this;

  Task
    .find({
      backlog: { $ne: null }
    })
    .sort({
      backlog: 1
    })
    .limit(MAX_DOCUMENT_COUNT_PER_QUERY)
    .then(tasks => async.timesSeries(
      tasks.length,
      (time, next) => {
        const task = tasks[time];

        if (task.backlog > Date.now())
          return next('force_stop');

        Task.findByIdAndUpdate(task._id, {$set: {
          backlog: null
        }}, err => next(err));
      },
      err => {
        if (err && err != 'force_stop')
          return callback(err);

        return callback(null);
      }
    ))
    .catch(_ => callback('database_error'))
};

module.exports = mongoose.model('Task', TaskSchema);
