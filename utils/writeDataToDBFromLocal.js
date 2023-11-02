const async = require('async');
const fs = require('fs');
const path = require('path');

const DUPLICATED_UNIQUE_FIELD_ERROR_CODE = 11000;

const Developer = require('../models/developer/Developer');
const DeveloperAnalytics = require('../models/developer_analytics/DeveloperAnalytics');
const Member = require('../models/member/Member');
const RemovedRepository = require('../models/removed_repository/RemovedRepository');
const Repository = require('../models/repository/Repository');
const RepositoryAnalytics = require('../models/repository_analytics/RepositoryAnalytics');
const Task = require('../models/task/Task');

module.exports = callback => {
  const models = { // Add models you want to write to DB
    RemovedRepository
  };

  fs.readFile(path.join(__dirname, '../LOCAL_DATA.json'), (err, file) => {
    if (err) return callback(err);
    const data = JSON.parse(file);

    const keys = Object.keys(data);

    async.timesSeries(
      keys.length,
      (time, next) => {
        const key = keys[time];
        const Model = models[key];
        const documents = data[key];

        async.timesSeries(
          documents.length,
          (time, next) => {
            const newDocument = new Model(documents[time]);
            
            newDocument.save(err => {
              if (err && err.code != DUPLICATED_UNIQUE_FIELD_ERROR_CODE) console.log(err);

              console.log(`${key} ${time + 1} finished.`);

              return next(null);
            });
          },
          err => next(err)
        );
      },
      err => {
        if (err) return callback(err);

        return callback(null);
      }
    );
  });
};