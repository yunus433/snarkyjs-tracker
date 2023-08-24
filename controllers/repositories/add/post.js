const Task = require('../../../models/task/Task');

const async = require('async');

module.exports = (req, res) => {
  const repositories = req.body.repositories;

  if (!repositories || !Array.isArray(repositories) || !repositories.length)
    return res.json({ success: false, error: 'bad_request' });

  async.timesSeries(
    count,
    (time, next) => Task.createTask({
      type: 'force_repo_update',
      data: {
        owner_name: repositories[time].owner_name,
        title: repositories[time].title
      }
    }, (err, task) => {
      if (err) return next(err);

      return callback(null, {
        developer,
        task_id: task._id.toString()
      });
    }),
    err => {
      if (err) return callback(err);

      setLastSearchTime('language_search', last_looked_at + count * FIVE_MINUTES_IN_MS, err => {
        if (err) return callback(err);

        callback(null, count);
      });
    }
  );
};