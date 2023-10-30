const RepositoryAnalytics = require('../../../../models/repository_analytics/RepositoryAnalytics.js');

module.exports = (req, res) => {
  RepositoryAnalytics.reduceAndGetAnalyicsForAYear(req.query.year, (err, result) => {
    if (err) return res.json({ success: false, error: err });

    return res.json({ success: true, result })
  });
};