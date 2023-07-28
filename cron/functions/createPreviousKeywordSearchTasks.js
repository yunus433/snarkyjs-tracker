const Task = require('../../models/task/Task');

const getLastSearchTime = require('./getLastSearchTime');
const setLastSearchTime = require('./setLastSearchTime');

const ONE_HOUR_IN_MS = 60 * 60 * 1000;

module.exports = callback => {
  getLastSearchTime('previous_keyword_search', (err, last_looked_at) => {
    if (err) return callback(err);

    Task.createTask({
      type: 'keyword_search',
      data: {
        min_time: last_looked_at - ONE_HOUR_IN_MS,
        max_time: last_looked_at
      }
    }, err => {
      if (err && err != 'duplicated_unique_field')
        return callback(err);

      setLastSearchTime('previous_keyword_search', last_looked_at - ONE_HOUR_IN_MS, err => {
        if (err) return callback(err);

        callback();
      });
    });
  });
};
