// This function is used to create 'force_update' Tasks for Repositories that are not updated in the last 5 mins

const FIVE_MINS_IN_MS = 5 * 60 * 1000;

const Repository = require('../models/repository/Repository');
const Task = require('../models/task/Task');

module.exports = (id, callback) => {
  Repository.findRepositoryByIdAndFormat(id, (err, repository) => {
    if (err) return callback(err);

    if (repository.latest_update_time.getTime() + FIVE_MINS_IN_MS >= Date.now())
      return callback(null, {
        repository,
        task_id: null
      });

    Task.createTask({
      type: 'force_update',
      data: {
        github_id: repository.github_id,
        owner_name: repository.developer.login,
        title: repository.title
      }
    }, (err, task) => {
      if (err) return callback(err);

      return callback(null, {
        repository,
        task_id: task._id.toString()
      });
    });
  });
};