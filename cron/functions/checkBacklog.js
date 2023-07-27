const Task = require('../../models/task/Task');

module.exports = callback => {
  Task.checkBacklog(err => {
    if (err) return callback(err);

    return callback(null);
  });
};