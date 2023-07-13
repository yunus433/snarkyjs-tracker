const RemovedRepository = require('../../models/removed_repository/RemovedRepository');

module.exports = callback => {
  RemovedRepository.findOldRemovedRepositoriesAndDelete(err => {
    if (err) return callback(err);

    return callback(null);
  });
};