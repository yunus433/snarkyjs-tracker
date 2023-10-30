const async = require('async');
const mongoose = require('mongoose');

const generateMonthString = require('../../utils/generateMonthString');
const getMonthLength = require('../../utils/getMonthLength');
const toMongoId = require('../../utils/toMongoId');

const DeveloperAnalytics = require('../developer_analytics/DeveloperAnalytics');

const generateKey = require('./functions/generateKey');

const DUPLICATED_UNIQUE_FIELD_ERROR_CODE = 11000;
const FULL_TIME_MIN_DAY_WITH_COMMIT_COUNT = 10;
const MAX_DATABASE_ARRAY_FIELD_LENGTH = 1e5;
const MONTH_LENGTH = 4 + 1 + 2; // YYYY-MM
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

const Schema = mongoose.Schema;

const RepositoryAnalyticsSchema = new Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  year: {
    type: Number,
    required: true,
    index: true,
    min: 0,
    max: 9999
  },
  month: { // Format: YYYY-MM
    type: String,
    required: true,
    length: MONTH_LENGTH
  },
  is_total: { // If true, data for entire month. Only data is spesific for a single repository 
    type: Boolean,
    required: true
  },
  repository_id: { // Defined only for is_total: false
    type: mongoose.Types.ObjectId
  },
  is_full_time: { // Defined only for is_total: false, True if number of days with a commit is more than FULL_TIME_MIN_DAY_WITH_COMMIT_COUNT, else False
    type: Boolean
  },
  full_time_repository_count: { // Defined only for is_total: true
    type: Number
  },
  new_repository_count: { // Defined only for is_total: true
    type: Number,
    min: 0 
  },
  total_commit_count: {
    type: Number,
    default: 0,
    min: 0
  },
  total_unique_commit_count: { // Defined only for is_total: true
    type: Number,
    default: 0,
    min: 0
  },
  total_day_with_commit_count: {
    type: Number,
    default: 0
  },
  each_day_new_repository_count_list: { // Defined only for is_total: true
    type: Array
  },
  each_day_commit_count_list: {
    type: Array
  },
  each_day_unique_commit_count_list: { // Defined only for is_total: true
    type: Array
  }
});

RepositoryAnalyticsSchema.statics._findRepositoryAnalyticsByKey = function (key, callback) {
  const RepositoryAnalytics = this;

  if (!key || typeof key != 'string' || !key.trim().length)
    return callback('bad_request');

  RepositoryAnalytics.findOne({ key }, (err, repository_analytics) => {
    if (err) return callback('database_error');
    if (!repository_analytics) return callback('document_not_found');

    return callback(null, repository_analytics);
  });
};

RepositoryAnalyticsSchema.statics._createOrFindRepositoryAnalytics = function (data, callback) {
  const RepositoryAnalytics = this;

  if (!data || typeof data != 'object')
    return callback('bad_request');

  if (!data.commit_date || isNaN(new Date(data.commit_date)))
    return callback('bad_request');

  const month = generateMonthString(data.commit_date);
  if (!month) return callback('bad_request');

  if (!data.is_total && (!data.repository_id || !toMongoId(data.repository_id)))
    return callback('bad_request');

  const is_total = data.is_total ? true : false;

  const key = generateKey({
    month,
    is_total,
    repository_id: data.repository_id
  });
  if (!key) return callback('bad_request');

  const newRepositoryAnalyticsData = {
    key,
    year: (new Date(data.commit_date)).getFullYear(),
    month,
    is_total,
    total_commit_count: 0,
    total_day_with_commit_count: 0,
    each_day_commit_count_list: new Array(getMonthLength(month)).fill(0)
  };

  const month_length = getMonthLength(month);

  if (is_total) {
    newRepositoryAnalyticsData.full_time_repository_count = 0;
    newRepositoryAnalyticsData.new_repository_count = 0;
    newRepositoryAnalyticsData.total_unique_commit_count = 0;
    newRepositoryAnalyticsData.each_day_new_repository_count_list = new Array(month_length).fill(0);
    newRepositoryAnalyticsData.each_day_unique_commit_count_list = new Array(month_length).fill(0);
  } else {
    newRepositoryAnalyticsData.repository_id = toMongoId(data.repository_id);
    newRepositoryAnalyticsData.is_full_time = false;
  }

  const newRepositoryAnalytics = new RepositoryAnalytics(newRepositoryAnalyticsData);

  newRepositoryAnalytics.save((err, repository_analytics) => {
    if (err && err.code != DUPLICATED_UNIQUE_FIELD_ERROR_CODE)
      return callback('database_error');
    if (!err) return callback(null, repository_analytics);

    RepositoryAnalytics._findRepositoryAnalyticsByKey(key, (err, repository_analytics) => {
      if (err) return callback(err);

      return callback(null, repository_analytics);
    });
  });
};

RepositoryAnalyticsSchema.statics.pushNewCommitToAnalytics = function (data, callback) {
  const RepositoryAnalytics = this;

  if (!data || typeof data != 'object')
    return callback('bad_request');

  if (!data.developer_id || !toMongoId(data.developer_id))
    return callback('bad_request');

  if (!data.repository_id || !toMongoId(data.repository_id))
    return callback('bad_request');

  if (!data.commit_date || isNaN(new Date(data.commit_date)))
    return callback('bad_request');

  const repository_id = toMongoId(data.repository_id).toString();
  const commit_day_index = (new Date(data.commit_date)).getDate() - 1;

  RepositoryAnalytics._createOrFindRepositoryAnalytics({
    commit_date: data.commit_date,
    repository_id
  }, (err, individual_analytics) => {
    if (err) return callback(err);

    const individual_update = {
      total_commit_count: individual_analytics.total_commit_count + 1,
      each_day_commit_count_list: individual_analytics.each_day_commit_count_list.map((count, index) => index == commit_day_index ? count + 1 : count)
    };

    if (!individual_analytics.each_day_commit_count_list[commit_day_index])
      individual_update.total_day_with_commit_count = individual_analytics.total_day_with_commit_count + 1;

    if (!individual_analytics.is_full_time && individual_update.total_day_with_commit_count && individual_update.total_day_with_commit_count >= FULL_TIME_MIN_DAY_WITH_COMMIT_COUNT)
      individual_update.is_full_time = true;

    RepositoryAnalytics.findByIdAndUpdate(individual_analytics._id, { $set: individual_update }, err => {
      if (err) return callback('database_error');

      RepositoryAnalytics._createOrFindRepositoryAnalytics({
        commit_date: data.commit_date,
        is_total: true
      }, (err, total_analytics) => {
        if (err) return callback(err);

        const total_update = {
          total_commit_count: total_analytics.total_commit_count + 1,
          each_day_commit_count_list: total_analytics.each_day_commit_count_list.map((count, index) => index == commit_day_index ? count + 1 : count),
        };

        if (individual_update.is_full_time)
          total_update.full_time_repository_count = total_analytics.full_time_repository_count + 1;

        if (!individual_analytics.total_commit_count) {
          total_update.total_unique_commit_count = total_analytics.total_unique_commit_count + 1;
          total_update.each_day_unique_commit_count_list = total_analytics.each_day_unique_commit_count_list.map((count, index) => index == commit_day_index ? count + 1 : count);
        }

        if (!total_analytics.each_day_commit_count_list[commit_day_index])
          total_update.total_day_with_commit_count = total_analytics.total_day_with_commit_count + 1;

        if (data.is_new_repository) {
          total_update.new_repository_count = total_analytics.new_repository_count + 1;
          total_update.each_day_new_repository_count_list = total_analytics.each_day_new_repository_count_list.map((count, index) => index == commit_day_index ? count + 1 : count);
        }

        RepositoryAnalytics.findByIdAndUpdate(total_analytics._id, { $set: total_update }, err => {
          if (err) return callback('database_error');
    
          DeveloperAnalytics.pushNewCommitToAnalytics({
            developer_id: data.developer_id,
            commit_date: data.commit_date,
            is_new_repository: data.is_new_repository,
            is_new_developer: data.is_new_developer,
            is_first_commit_this_month: !individual_analytics.total_commit_count,
            is_first_commit_this_day: !individual_analytics.each_day_commit_count_list[commit_day_index]
          }, err => {
            if (err) return callback(err);

            return callback(null);
          });
        });
      });
    });
  });
};

RepositoryAnalyticsSchema.statics.reduceAndGetAnalyicsForAMonth = function (_month, callback) { // Reduces is_total: true, returns the numbers 
  const RepositoryAnalytics = this;

  if (!_month || isNaN(new Date(_month)))
    return callback('bad_request');

  const month = generateMonthString(new Date(_month));
  const month_length = getMonthLength(month);

  RepositoryAnalytics.findOne({
    month,
    is_total: true
  }, (err, total_repository_analytics) => {
    if (err) return callback('database_error');

    if (!total_repository_analytics)
      return callback(null, {
        total_new_repository_count: 0,
        total_full_time_repository_count: 0,
        total_commit_count: 0,
        total_unique_commit_count: 0,
        total_day_with_commit_count: 0,
        daily_new_repository_count_list: new Array(month_length).fill(0),
        daily_commit_count_list: new Array(month_length).fill(0),
        daily_unique_commit_count_list: new Array(month_length).fill(0)
      });
    
    return callback(null, {
      total_new_repository_count: total_repository_analytics.new_repository_count,
      total_full_time_repository_count: total_repository_analytics.full_time_repository_count,
      total_commit_count: total_repository_analytics.total_commit_count,
      total_unique_commit_count: total_repository_analytics.total_unique_commit_count,
      total_day_with_commit_count: total_repository_analytics.total_day_with_commit_count,
      daily_new_repository_count_list: total_repository_analytics.each_day_new_repository_count_list,
      daily_commit_count_list: total_repository_analytics.each_day_commit_count_list,
      daily_unique_commit_count_list: total_repository_analytics.each_day_unique_commit_count_list
    });
  });
};

RepositoryAnalyticsSchema.statics.getAnalyticsForAMonth = function (_month, callback) { // Returns is_total: false documents, returns the list of repositories
  const RepositoryAnalytics = this;

  if (!_month || isNaN(new Date(_month)))
    return callback('bad_request');

  const month = generateMonthString(new Date(_month));
  const month_length = getMonthLength(month);

  RepositoryAnalytics.reduceAndGetAnalyicsForAMonth(_month, (err, total_data) => {
    if (err) return callback(err);

    RepositoryAnalytics.find({
      month,
      is_total: false
    }, (err, individual_repository_analytics_list) => {
      if (err) return callback('database_error');
  
      const data = {
        total_new_repository_count: total_data.total_new_repository_count,
        total_full_time_repository_count: total_data.total_full_time_repository_count,
        total_commit_count: total_data.total_commit_count,
        total_unique_commit_count: total_data.total_unique_commit_count,
        total_day_with_commit_count: total_data.total_day_with_commit_count,
        daily_new_repository_list: new Array(month_length).fill([]), // To be filled by Repository model
        daily_commited_repository_list: new Array(month_length).fill([])
      };
  
      async.timesSeries(
        individual_repository_analytics_list.length,
        (time, next) => {
          const individual_repository_analytics = individual_repository_analytics_list[time];
  
          data.daily_commited_repository_list = data.daily_commited_repository_list.map((repository_list, index) => {
            const new_repository_list = JSON.parse(JSON.stringify(repository_list));

            if (individual_repository_analytics.each_day_commit_count_list[index] > 0)
              new_repository_list.push(individual_repository_analytics.repository_id.toString());
  
            return new_repository_list;
          });

          return next(null);
        },
        err => {
          if (err) return callback(err);

          return callback(null, data);
        }
      );
    });
  });
};

RepositoryAnalyticsSchema.statics.reduceAndGetAnalyicsForAYear = function (_year, callback) { // Reduces is_total: true documents for the year, only returns numbers
  const RepositoryAnalytics = this;

  if (!_year || isNaN(new Date(_year)))
    return callback('bad_request');

  const year = (new Date(_year)).getFullYear();

  RepositoryAnalytics.find({
    year,
    is_total: true
  }, (err, analytics) => {
    if (err) return callback('database_error');

    const data = {
      total_new_repository_count: 0,
      total_full_time_repository_count: 0,
      total_commit_count: 0,
      total_unique_commit_count: 0,
      total_day_with_commit_count: 0,
      monthly_new_repository_count_list: new Array(12).fill(0),
      monthly_full_time_repository_count_list: new Array(12).fill(0),
      monthly_commit_count_list: new Array(12).fill(0),
      monthly_unique_commit_count_list: new Array(12).fill(0),
      monthly_day_with_commit_count_list: new Array(12).fill(0),
    };

    async.timesSeries(
      analytics.length,
      (time, next) => {
        const analytic = analytics[time];
        const month = parseInt(analytic.month.split('-')[1]) - 1;

        data.total_new_repository_count += analytic.new_repository_count;
        data.total_full_time_repository_count += analytic.full_time_repository_count;
        data.total_commit_count += analytic.total_commit_count;
        data.total_unique_commit_count += analytic.total_unique_commit_count;
        data.total_day_with_commit_count += analytic.total_day_with_commit_count;
        data.monthly_new_repository_count_list[month] += analytic.new_repository_count;
        data.monthly_full_time_repository_count_list[month] += analytic.full_time_repository_count;
        data.monthly_commit_count_list[month] += analytic.total_commit_count;
        data.monthly_unique_commit_count_list[month] += analytic.total_unique_commit_count;
        data.monthly_day_with_commit_count_list[month] += analytic.total_day_with_commit_count;

        return next(null);
      },
      _ => callback(null, data)
    );
  });
};

module.exports = mongoose.model('RepositoryAnalytics', RepositoryAnalyticsSchema);