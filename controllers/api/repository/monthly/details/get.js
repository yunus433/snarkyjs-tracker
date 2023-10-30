const Repository = require('../../../../../models/repository/Repository');

module.exports = (req, res) => {
  Repository.getRepositoryAnalyticsForAMonth(req.query.month, (err, result) => {
    if (err) return res.json({ success: false, error: err });

    return res.json({ success: true, result })
  });
};