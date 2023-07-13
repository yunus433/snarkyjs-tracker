const Task = require('../../models/task/Task');

module.exports = callback => {
  Task.performLatestTask(err => callback(err));
};