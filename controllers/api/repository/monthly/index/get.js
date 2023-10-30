const RepositoryAnalytics = require('../../../../../models/repository_analytics/RepositoryAnalytics');

module.exports = (req, res) => {
  RepositoryAnalytics.reduceAndGetAnalyicsForAMonth(req.query.month, (err, result) => {
    if (err) return res.json({ success: false, error: err });

    return res.json({ success: true, result })
  });
};