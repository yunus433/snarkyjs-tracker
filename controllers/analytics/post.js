const RepositoryAnalytics = require('../../models/repository_analytics/RepositoryAnalytics');

module.exports = (req, res) => {
  RepositoryAnalytics.pushNewCommitToAnalytics(req.body, err => {
    if (err) {
      res.write(JSON.stringify({ error: 'bad_request', success: false }));
      return res.end();
    }

    res.write(JSON.stringify({ success: true }));
    return res.end();
  });
};