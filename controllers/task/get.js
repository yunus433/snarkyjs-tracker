const Task = require('../../models/task/Task');

module.exports = (req, res) => {
  Task.findTaskByIdAndReturnIfPerformed(req.query.id, (err, res) => {
    if (err) return res.json({ success: false, error: err });

    return res.json({ success: true, performed: res });
  });
};