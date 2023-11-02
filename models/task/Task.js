// IMPORTANT NOTES!
// This class is a shadow model, should not be directly accessed in any way by a controller. It is managed by CronJob scripts
// There is no type checks etc. on the data, as it is assumed that the data is already validated by the CronJob scripts.
// None of the static functions of the class returns anything but the errors, as this is a closed model.
// About Backlog
// Backlog is used only for error tracking, to not loose any task that is not performed due to an error.

const async = require('async');
const mongoose = require('mongoose');

const gitAPIRequest = require('../../utils/gitAPIRequest');
const toMongoId = require('../../utils/toMongoId')

const RemovedRepository = require('../removed_repository/RemovedRepository');
const Repository = require('../repository/Repository');

const generateKey = require('./functions/generateKey');

const BACKLOG_FINISH_TIME = 2 * 24 * 60 * 60 * 1000;
const DEFAULT_START_INTERVAL_TO_CREATE_TASK = 24 * 60 * 60 * 1000;
const DUPLICATED_UNIQUE_FIELD_ERROR_CODE = 11000;
const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;
const MAX_DATABASE_TEXT_FIELD_LENGTH = 1e4;
const MAX_DATABASE_OBJECT_KEY_COUNT = 1e3;
const MAX_DOCUMENT_COUNT_PER_QUERY = 1e3;
const MIN_PRIORITY_VALUE = 0;
const ONE_HOUR_IN_MS = 60 * 60 * 1000;
const STATUS_CODES = {
  empty: 0,
  not_o1js: 1,
  o1js: 2
};
const TYPE_PRIORITY_MAP = {
  'check': 0,
  'search': 1
};
const TYPE_VALUES = ['check', 'search', 'storage'];

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

TaskSchema.statics.findTaskByKey = function (key, callback) {
  const Task = this;

  if (!key || typeof key != 'string' || !key.length || key.length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');

  Task.findOne({
    key
  }, (err, task) => {
    if (err) return callback('database_error');
    if (!task) return callback('document_not_found');

    return callback(null, task);
  });
};

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

TaskSchema.statics.createOrFindStorageTask = function (data, callback) {
  const Task = this;

  if (!data || typeof data != 'object')
    return callback('bad_request');

  if (!data.data || typeof data.data != 'object' || !Object.keys(data.data).length || Object.keys(data.data).length > MAX_DATABASE_OBJECT_KEY_COUNT)
    return callback('bad_request');

  if (!data.data.name || typeof data.data.name != 'string' || !data.data.name.length || data.data.name.length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');

  const keyData = {
    type: 'storage',
    data: {
      name: data.data.name
    }
  };

  const key = generateKey(keyData);

  if (!key) return callback('bad_request');

  const newTask = new Task({
    key,
    priority: 9999,
    type: 'storage',
    data: data.data,
    backlog: 1
  });

  newTask.save((err, task) => {
    if (!err) return callback(null, task);
    if (err && err.code != DUPLICATED_UNIQUE_FIELD_ERROR_CODE)
      return callback('database_error');

    Task.findTaskByKey(key, (err, task) => {
      if (err) return callback(err);

      return callback(null, task);
    });
  });
}

TaskSchema.statics.createOrFindTask = function (data, callback) {
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
    if (!err) return callback(null, task);
    if (err && err.code != DUPLICATED_UNIQUE_FIELD_ERROR_CODE)
      return callback('database_error');

    Task.findTaskByKey(key, (err, task) => {
      if (err) return callback(err);

      return callback(null, task);
    });
  });
};

TaskSchema.statics.createSearchTasks = function (callback) {
  const Task = this;

  Task.createOrFindStorageTask({
    data: {
      name: 'search-time'
    }
  }, (err, task) => {
    if (err) return callback('database_error');

    const startTime = task.data.search_time ? task.data.search_time : Date.now() - DEFAULT_START_INTERVAL_TO_CREATE_TASK;
    const endTime = Date.now();
    const taskCount = Math.floor((endTime - startTime) / FIVE_MINUTES_IN_MS);

    if (!taskCount) return callback(null, 0);

    async.timesSeries(
      taskCount,
      (time, next) => Task.createOrFindTask({
        type: 'search',
        data: {
          min_time: startTime + time * FIVE_MINUTES_IN_MS,
          max_time: startTime + (time + 1) * FIVE_MINUTES_IN_MS
        }
      }, err => next(err)),
      err => {
        if (err) return callback(err);

        Task.findByIdAndUpdate(task._id, {$set: {
          'data.search_time': endTime
        }}, err => {
          if (err) return callback('database_error');

          return callback(null, taskCount);
        });
      }
    );
  });
};

TaskSchema.statics.createPreviousSearchTasks = function (callback) {
  const Task = this;

  Task.createOrFindStorageTask({
    data: {
      name: 'previous-search-time'
    }
  }, (err, task) => {
      if (err) return callback('database_error');

      const endTime = task.data.previous_search_time ? task.data.previous_search_time : Date.now() - DEFAULT_START_INTERVAL_TO_CREATE_TASK;
      const startTime = endTime - ONE_HOUR_IN_MS;
      const taskCount = Math.floor((endTime - startTime) / FIVE_MINUTES_IN_MS);

      if (!taskCount) return callback(null, 0);

      async.timesSeries(
        taskCount,
        (time, next) => Task.createOrFindTask({
          type: 'search',
          data: {
            min_time: startTime + time * FIVE_MINUTES_IN_MS,
            max_time: startTime + (time + 1) * FIVE_MINUTES_IN_MS
          }
        }, err => next(err)),
        err => {
          if (err) return callback(err);

          Task.findByIdAndUpdate(task._id, {$set: {
            'data.previous_search_time': startTime
          }}, err => {
            if (err) return callback('database_error');

            return callback(null, taskCount);
          });
        }
      );
    });
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
    if (!task) return callback(null);

    Task.createOrFindTask({
      type: task.type,
      data: task.data,
      backlog: Date.now() + BACKLOG_FINISH_TIME
    }, (err, task) => callback(err, task));
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
      _id: -1
    })
    .limit(1)
    .then(tasks => {
      if (!tasks || !tasks.length)
        return callback(null);

      const task = tasks[0];

      console.log('Current Task Key: ', task.key);

      gitAPIRequest(task.type, task.data, (err, result) => {
        if (err) {
          console.error('API Request Error: ', err);

          if (err == 'repository_deleted') {
            Task.findTaskByIdAndDelete(task._id, err => {
              if (err) return callback(err);

              return callback(null);
            });
          } else {
            Task.findTaskByIdAndRecreate(task._id, err => {
              if (err) return callback(err);
  
              return callback(null);
            });
          }
        } else {
          if (task.type == 'check') {
            console.log('API Request Result: ' + Object.keys(STATUS_CODES)[Object.values(STATUS_CODES).indexOf(result.status)]);

            if (!task.data || !task.data.github_id)
              return callback('impossible_error');

            const github_id = task.data.github_id;
  
            if (result.status == STATUS_CODES.empty) {
              Task.findTaskByIdAndDelete(task._id, err => {
                if (err) return callback(err);

                return callback(null);
              });
            } else if (result.status == STATUS_CODES.not_o1js) {
              RemovedRepository.createRemovedRepository({
                github_id
              }, err => {
                if (err) return callback(err);
  
                Task.findTaskByIdAndDelete(task._id, err => {
                  if (err) return callback(err);

                  return callback(null);
                });
              });
            } else if (result.status == STATUS_CODES.o1js) {
              if (!result.repository) return callback('impossible_error');

              result.repository.commit_date = task.data.commit_date;

              Repository.createRepository(result.repository, err => {
                if (err) return callback(err);
  
                Task.findTaskByIdAndDelete(task._id, err => {
                  if (err) return callback(err);
  
                  return callback(null);
                });
              });
            };
          } else if (task.type == 'search') {
            const commit_date = ((new Date(task.data.min_time)).getTime() + (new Date(task.data.max_time)).getTime()) / 2; // Approximated by the average

            console.log('API Request Result: Found Repository Count ' + result?.length);

            if (!result || !Array.isArray(result))
              return callback('unknown_error');

            const repositories = result;

            Task.findTaskByIdAndDelete(task._id, err => {
              if (err) return callback(err);

              callback(null); // Create tasks async

              let createdCount = 0, removedCount = 0, updatedCount = 0;

              async.timesSeries(
                repositories.length,
                (time, next) => {
                  const data = repositories[time];
    
                  if (!data) return next('unknown_error');

                  RemovedRepository.findRemovedRepositoryByGitHubId(data.github_id, (err, removed_repository) => {
                    if (err && err != 'document_not_found') {
                      console.log(`Create Search Results Error (${new Date}): ${err}`)
                      return next(null);
                    } else if (!err && removed_repository) {
                      removedCount++;
                      return next(null);
                    } else {
                      Repository.findRepositoryByGitHubId(data.github_id, (err, repository) => {
                        if (err && err != 'document_not_found') {
                          console.log(`Create Search Results Error (${new Date}): ${err}`)
                          return next(null);
                        } else if (!err && repository) {
                          Repository.findRepositoryByIdAndUpdate(repository._id, {
                            title: data.title,
                            description: data.description,
                            url: data.url,
                            last_pushed_at: data.last_pushed_at,
                            default_branch: data.default_branch,
                            commit_count: repository.commit_count + 1,
                            commit_date,
                            owner: data.owner
                          }, err => {
                            if (err) {
                              console.log(`Create Search Results Error (${new Date}): ${err}`)
                              return next(null);
                            }

                            updatedCount++;
                            return next(null);
                          });
                        } else {
                          Task.createOrFindTask({
                            type: 'check',
                            data: {
                              github_id: data.github_id,
                              owner: data.owner.login,
                              title: data.title,
                              default_branch: data.default_branch,
                              commit_date
                            }
                          }, err => {
                            if (err) {
                              console.log(`Create Search Results Error (${new Date}): ${err}`)
                              return next(null);
                            }
          
                            createdCount++;
                            return next();
                          });
                        }
                      });
                    }
                  });
                },
                _ => {
                  console.log(`Search Results Created (${new Date}). New Check Task Count: ${createdCount}, Updated Repository Count: ${updatedCount}, Already Removed Repository Count: ${removedCount}.`);
                }
              );
            });
          } else {
            return callback('unknown_error');
          }
        }
      });
    })
    .catch(_ => callback('database_error'));
};

TaskSchema.statics.performBacklogCheckTasks = function (callback) {
  const Task = this;

  Task
    .find({
      type: 'check',
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
        }}, err => next(err, 1));
      },
      (err, results) => {
        if (err && err != 'force_stop')
          return callback(err);

        console.log(`Backlog Checked (${new Date}). Created Task Count: ${results.length}`);

        return callback(null);
      }
    ))
    .catch(_ => callback('database_error'))
};

TaskSchema.statics.checkIfThereIsAnyTask = function (callback) {
  const Task = this;

  Task.findOne({
    $or: [
      { backlog: null },
      { backlog: { $lt: Date.now() } }
    ]
  }, (err, task) => {
    if (err) return callback('database_error');

    if (task) return callback(null, true);

    return callback(null, false);
  });
};

module.exports = mongoose.model('Task', TaskSchema);
