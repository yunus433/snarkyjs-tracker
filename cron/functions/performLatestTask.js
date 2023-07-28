const Task = require('../../models/task/Task');

module.exports = (latestTaskID, callback) => {
  Task.performLatestTask(latestTaskID, err => callback(err));
};