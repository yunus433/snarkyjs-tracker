const Repository = require('../../models/repository/Repository');

module.exports = callback => {
  Repository.checkBacklog(err => {
    if (err) return callback(err);

    return callback(null);
  });
};