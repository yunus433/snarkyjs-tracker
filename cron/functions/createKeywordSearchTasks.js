const async = require('async');

const Task = require('../../models/task/Task');

const getLastSearchTime = require('./getLastSearchTime');
const setLastSearchTime = require('./setLastSearchTime');

const ONE_HOUR_IN_MS = 60 * 60 * 1000;

module.exports = callback => {
  getLastSearchTime('keyword_search', (err, last_looked_at) => {
    if (err) return callback(err);

    const count = parseInt((Date.now() - last_looked_at) / ONE_HOUR_IN_MS);

    if (!count) return callback();

    async.timesSeries(
      count - 1,
      (time, next) => Task.createTask({
        type: 'keyword_search',
        data: {
          min_time: last_looked_at + time * ONE_HOUR_IN_MS,
          max_time: last_looked_at + (time + 1) * ONE_HOUR_IN_MS
        }
      }, err => next(err)),
      err => {
        if (err) return callback(err);

        setLastSearchTime('keyword_search', last_looked_at + count * ONE_HOUR_IN_MS, err => {
          if (err) return callback(err);

          callback();
        });
      }
    );
  });
};
