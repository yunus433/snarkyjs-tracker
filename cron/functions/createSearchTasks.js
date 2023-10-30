const Task = require('../../models/task/Task');

module.exports = callback => {
  Task.createSearchTasks((err, new_task_count) => {
    if (err) return callback(err);

    if (new_task_count) return callback(null);

    Task.checkIfThereIsAnyTask((err, res) => {
      if (err) return callback(err);
      if (res) return callback(null);

      console.log('No waiting task found. Creating previous search tasks...');

      Task.createPreviousSearchTasks(err => {
        if (err) return callback(err);

        console.log('Previous search tasks created.');

        callback(null);
      });
    });
  });
};

