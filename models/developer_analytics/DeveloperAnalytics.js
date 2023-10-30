const async = require('async');
const mongoose = require('mongoose');

const generateMonthString = require('../../utils/generateMonthString');
const getMonthLength = require('../../utils/getMonthLength');
const toMongoId = require('../../utils/toMongoId');

const generateKey = require('./functions/generateKey');

const DUPLICATED_UNIQUE_FIELD_ERROR_CODE = 11000;
const FULL_TIME_MIN_DAY_WITH_COMMIT_COUNT = 10;
const MAX_DATABASE_ARRAY_FIELD_LENGTH = 1e5;
const MONTH_LENGTH = 4 + 1 + 2; // YYYY-MM
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

const Schema = mongoose.Schema;

const DeveloperAnalyticsSchema = new Schema({
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
  is_total: { // If true, data for entire month. Only data is spesific for a single developer 
    type: Boolean,
    required: true
  },
  developer_id: { // Defined only for is_total: false
    type: mongoose.Types.ObjectId
  },
  is_full_time: { // Defined only for is_total: false, True if number of days with a commit is more than FULL_TIME_MIN_DAY_WITH_COMMIT_COUNT, else False
    type: Boolean
  },
  full_time_developer_count: { // Defined only for is_total: true
    type: Number
  },
  new_developer_count: { // Defined only for is_total: true
    type: Number,
    min: 0
  },
  new_repository_count: { // Defined only for is_total: false
    type: Number,
    min: 0
  },
  total_commit_count: { // Defined only for is_total: false
    type: Number,
    default: 0,
    min: 0
  },
  total_unique_commit_count: {
    type: Number,
    default: 0,
    min: 0
  },
  total_day_with_commit_count: { // Defined only for is_total: false
    type: Number,
    default: 0
  },
  each_day_new_developer_count_list: { // Defined only for is_total: true
    type: Array
  },
  each_day_new_repository_count_list: { // Defined only for is_total: false
    type: Array
  },
  each_day_commit_count_list: { // Defined only for is_total: false
    type: Array
  },
  each_day_unique_commit_count_list: {
    type: Array
  }
});

DeveloperAnalyticsSchema.statics._findDeveloperAnalyticsByKey = function (key, callback) {
  const DeveloperAnalytics = this;

  if (!key || typeof key != 'string' || !key.trim().length)
    return callback('bad_request');

  DeveloperAnalytics.findOne({ key }, (err, developer_analytics) => {
    if (err) return callback('database_error');
    if (!developer_analytics) return callback('document_not_found');

    return callback(null, developer_analytics);
  });
};

DeveloperAnalyticsSchema.statics._createOrFindDeveloperAnalytics = function (data, callback) {
  const DeveloperAnalytics = this;

  if (!data || typeof data != 'object')
    return callback('bad_request');

  if (!data.commit_date || isNaN(new Date(data.commit_date)))
    return callback('bad_request');

  const month = generateMonthString(data.commit_date);
  if (!month) return callback('bad_request');

  if (!data.is_total && (!data.developer_id || !toMongoId(data.developer_id)))
    return callback('bad_request');

  const is_total = data.is_total ? true : false;

  const key = generateKey({
    month,
    is_total,
    developer_id: data.developer_id
  });
  if (!key) return callback('bad_request');

  const month_length = getMonthLength(month);

  const newDeveloperAnalyticsData = {
    key,
    year: (new Date(data.commit_date)).getFullYear(),
    month,
    is_total,
    total_unique_commit_count: 0,
    each_day_unique_commit_count_list: new Array(month_length).fill(0)
  };

  if (is_total) {
    newDeveloperAnalyticsData.full_time_developer_count = 0;
    newDeveloperAnalyticsData.new_developer_count = 0;
    newDeveloperAnalyticsData.each_day_new_developer_count_list = new Array(month_length).fill(0);
  } else {
    newDeveloperAnalyticsData.developer_id = toMongoId(data.developer_id);
    newDeveloperAnalyticsData.is_full_time = false;
    newDeveloperAnalyticsData.total_commit_count = 0;
    newDeveloperAnalyticsData.total_day_with_commit_count = 0;
    newDeveloperAnalyticsData.new_repository_count = 0;
    newDeveloperAnalyticsData.each_day_new_repository_count_list = new Array(month_length).fill(0);
    newDeveloperAnalyticsData.each_day_commit_count_list = new Array(getMonthLength(month)).fill(0);
  }

  const newDeveloperAnalytics = new DeveloperAnalytics(newDeveloperAnalyticsData);

  newDeveloperAnalytics.save((err, developer_analytics) => {
    if (err && err.code != DUPLICATED_UNIQUE_FIELD_ERROR_CODE)
      return callback('database_error');
    if (!err) return callback(null, developer_analytics);

    DeveloperAnalytics._findDeveloperAnalyticsByKey(key, (err, developer_analytics) => {
      if (err) return callback(err);

      return callback(null, developer_analytics);
    });
  });
};

DeveloperAnalyticsSchema.statics.pushNewCommitToAnalytics = function (data, callback) {
  const DeveloperAnalytics = this;

  if (!data || typeof data != 'object')
    return callback('bad_request');

  if (!data.developer_id || !toMongoId(data.developer_id))
    return callback('bad_request');

  if (!data.commit_date || isNaN(new Date(data.commit_date)))
    return callback('bad_request');

  const developer_id = toMongoId(data.developer_id).toString();
  const commit_day_index = (new Date(data.commit_date)).getDate() - 1;

  DeveloperAnalytics._createOrFindDeveloperAnalytics({
    commit_date: data.commit_date,
    developer_id
  }, (err, individual_analytics) => {
    if (err) return callback(err);

    const individual_update = {
      total_commit_count: individual_analytics.total_commit_count + 1,
      each_day_commit_count_list: individual_analytics.each_day_commit_count_list.map((count, index) => index == commit_day_index ? count + 1 : count)
    };

    if (data.is_new_repository) {
      individual_update.new_repository_count = individual_analytics.new_repository_count + 1;
      individual_update.each_day_new_repository_count_list = individual_analytics.each_day_new_repository_count_list.map((count, index) => index == commit_day_index ? count + 1 : count);
    };

    if (data.is_first_commit_this_month) {
      individual_update.total_unique_commit_count = individual_analytics.total_unique_commit_count + 1;
      individual_update.each_day_unique_commit_count_list = individual_analytics.each_day_unique_commit_count_list.map((count, index) => index == commit_day_index ? count + 1 : count);
    };

    if (data.is_first_commit_this_day)
      individual_update.total_day_with_commit_count = individual_analytics.total_day_with_commit_count + 1;

    if (!individual_analytics.is_full_time && individual_update.total_day_with_commit_count && individual_update.total_day_with_commit_count >= FULL_TIME_MIN_DAY_WITH_COMMIT_COUNT)
      individual_update.is_full_time = true;

    DeveloperAnalytics.findByIdAndUpdate(individual_analytics._id, { $set: individual_update }, err => {
      if (err) return callback('database_error');

      DeveloperAnalytics._createOrFindDeveloperAnalytics({
        commit_date: data.commit_date,
        is_total: true
      }, (err, total_analytics) => {
        if (err) return callback(err);

        const total_update = { };

        if (!individual_analytics.total_commit_count) {
          total_update.total_unique_commit_count = total_analytics.total_unique_commit_count + 1;
          total_update.each_day_unique_commit_count_list = total_analytics.each_day_unique_commit_count_list.map((count, index) => index == commit_day_index ? count + 1 : count);
        };

        if (individual_update.is_full_time)
          total_update.full_time_developer_count = total_analytics.full_time_developer_count + 1;

        if (data.is_new_developer) {
          total_update.new_developer_count = total_analytics.new_developer_count + 1;
          total_update.each_day_new_developer_count_list = total_analytics.each_day_new_developer_count_list.map((count, index) => index == commit_day_index ? count + 1 : count);
        };

        if (!Object.keys(total_update).length)
          return callback(null);

        DeveloperAnalytics.findByIdAndUpdate(total_analytics._id, { $set: total_update }, err => {
          if (err) return callback('database_error');
    
          return callback(null);
        });
      });
    });
  });
};

DeveloperAnalyticsSchema.statics.reduceAndGetAnalyicForAMonth = function (_date, is_detailed, callback) { // Reduces is_total: false documents, returns the list of repositories 
  const DeveloperAnalytics = this;

  if (!_date || isNaN(new Date(_date)))
    return callback('bad_request');

  const date = new Date(_date);

  const month = generateMonthString(date);
  const month_length = getMonthLength(month);

  DeveloperAnalytics.findOne({
    month,
    is_total: true
  }, (err, total_developer_analytics) => {
    if (err) return callback('database_error');

    if (!total_developer_analytics)
      return callback(null, {
        commit_count: 0,
        developer_with_commit_count: 0,
        full_time_developer_count: 0,
        new_developer_count: 0,
        new_developer_count_list: new Array(month_length).fill(0),
        commit_count_list: new Array(month_length).fill(0),
        developer_with_commit_count_list: new Array(month_length).fill(0)
      });

    const data = {
      commit_count: total_developer_analytics.total_commit_count,
      developer_with_commit_count: total_developer_analytics.total_unique_commit_count,
      full_time_developer_count: total_developer_analytics.full_time_developer_count,
      new_developer_count: total_developer_analytics.new_developer_count,
      new_developer_count_list: total_developer_analytics.each_day_new_developer_count_list,
      commit_count_list: total_developer_analytics.each_day_commit_count_list,
      developer_with_commit_count_list: total_developer_analytics.each_day_unique_commit_count_list,
      // new_developer_id_list
    };

    if (!is_detailed) return callback(null, data);

    DeveloperAnalytics.find({
      month,
      is_total: false
    }, (err, individual_developer_analytics_list) => {
      if (err) return callback('database_error');

      async.timesSeries(
        individual_developer_analytics_list.length,
        (time, next) => {
          const individual_developer_analytics = individual_developer_analytics_list[time];

          data
        },
        err => {
          if (err) return callback(err);

          return callback(null, data);
        }
      )
    });
  });
};

DeveloperAnalyticsSchema.statics.reduceAndGetAnalyicsForAYear = function (date, callback) { // Reduces is_total: true documents for the year, only returns numbers

};

module.exports = mongoose.model('DeveloperAnalytics', DeveloperAnalyticsSchema);