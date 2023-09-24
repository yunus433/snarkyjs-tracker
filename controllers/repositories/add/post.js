const Task = require('../../../models/task/Task');

module.exports = (req, res) => {
  Task.createManuelRepositoryUpdateTask(req.body, (err, task) => {
    if (err) return res.json({ success: false, error: err });

    res.json({ success: true });
  });
};