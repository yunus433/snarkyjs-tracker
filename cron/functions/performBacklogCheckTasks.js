const Task = require('../../models/task/Task');

module.exports = callback => {
  Task.performBacklogCheckTasks(err => {
    if (err) return callback(err);

    return callback(null);
  });
};