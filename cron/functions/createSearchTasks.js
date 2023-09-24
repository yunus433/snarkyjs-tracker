const Task = require('../../models/task/Task');

const createKeywordSearchTasks = require('./createKeywordSearchTasks');
const createLanguageSearchTasks = require('./createLanguageSearchTasks');
const createPreviousKeywordSearchTasks = require('./createPreviousKeywordSearchTasks');
const createPreviousLanguageSearchTasks = require('./createPreviousLanguageSearchTasks');

module.exports = callback => {
  createKeywordSearchTasks((err, new_keyword_task_count) => {
    if (err) return callback(err);

    createLanguageSearchTasks((err, new_language_task_count) => {
      if (err) return callback(err);

      if (new_keyword_task_count || new_language_task_count)
        return callback(null);

      Task.checkIfThereIsAnyTask((err, res) => {
        if (err) return callback(err);
        if (res) return callback(null);

        console.log('No waiting task found. Creating previous search tasks...');

        createPreviousKeywordSearchTasks(err => {
          if (err) return callback(err);
  
          createPreviousLanguageSearchTasks(err => {
            if (err) return callback(err);

            console.log('Previous search tasks created.');
  
            callback(null);
          });
        });
      });
    });
  });
};

