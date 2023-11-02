const async = require('async');
const fs = require('fs');
const path = require('path');

const Developer = require('../models/developer/Developer');
const DeveloperAnalytics = require('../models/developer_analytics/DeveloperAnalytics');
const Member = require('../models/member/Member');
const RemovedRepository = require('../models/removed_repository/RemovedRepository');
const Repository = require('../models/repository/Repository');
const RepositoryAnalytics = require('../models/repository_analytics/RepositoryAnalytics');
const Task = require('../models/task/Task');

const SKIP_COUNT = 61979;
const MAX_COUNT = 1e5; // Take 100000 documents at a time
const MAX_ITEM_COUNT_PER_QUERY = 1e3;

module.exports = callback => {
  const models = [RemovedRepository];
  const modelNames = ['RemovedRepository'];

  async.timesSeries(
    models.length,
    (time1, next) => {
      models[time1]
        .find()
        .skip(SKIP_COUNT)
        .countDocuments()
        .then(_number => {
          const number = Math.min(_number, MAX_COUNT);
          const numberOfPatches = Math.trunc(number / MAX_ITEM_COUNT_PER_QUERY) + (number % MAX_ITEM_COUNT_PER_QUERY == 0 ? 0 : 1);
          let data = [];

          async.timesSeries(
            numberOfPatches,
            (time, next) => {
              models[time1]
                .find()
                .skip(SKIP_COUNT + time * MAX_ITEM_COUNT_PER_QUERY)
                .limit(MAX_ITEM_COUNT_PER_QUERY)
                .then(documents => {
                  console.log(`Model ${time1 + 1} (${modelNames[time1]}), patch ${time + 1} is completed.`);
                  data = data.concat(documents);
                  next(null);
                })
                .catch(err => next(err));
            },
            err => {
              if (err) return next(err);

              console.log(`Model ${time1 + 1} (${modelNames[time1]}) is completed.`);

              return next(null, data);
            }
          );
        })
        .catch(err => next(err));
    },
    (err, data_as_array) => {
      if (err) return callback(err);

      const data = {};

      data_as_array.forEach((model, index) => {
        data[modelNames[index]] = model;
      });

      fs.writeFile(path.join(__dirname, '../LOCAL_DATA.json'), JSON.stringify(data), err => {
        if (err) return callback(err);

        return callback(null);
      });
    }
  );
};