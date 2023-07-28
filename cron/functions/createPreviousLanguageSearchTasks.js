const async = require('async');

const Task = require('../../models/task/Task');

const getLastSearchTime = require('./getLastSearchTime');
const setLastSearchTime = require('./setLastSearchTime');

const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;
const ONE_HOUR_IN_MS = 60 * 60 * 1000;

module.exports = callback => {
  const count = ONE_HOUR_IN_MS / FIVE_MINUTES_IN_MS;

  getLastSearchTime('previous_language_search', (err, last_looked_at) => {
    if (err) return callback(err);

    async.timesSeries(
      count,
      (time, next) => Task.createTask({
        type: 'language_search',
        data: {
          min_time: last_looked_at - (time + 1) * FIVE_MINUTES_IN_MS,
          max_time: last_looked_at - time * FIVE_MINUTES_IN_MS
        }
      }, err => {
        if (err && err != 'duplicated_unique_field')
          return next(err);
        return next(null);
      }),
      err => {
        if (err) return callback(err);

        setLastSearchTime('previous_language_search', last_looked_at - ONE_HOUR_IN_MS, err => {
          if (err) return callback(err);

          callback();
        });
      }
    );
  });
};
