const async = require('async');
const mongoose = require('mongoose');
const validator = require('validator');

const toMongoId = require('../../utils/toMongoId');

const formatMember = require('./functions/formatMember');
const hashPassword = require('./functions/hashPassword');
const verifyPassword = require('./functions/verifyPassword');

const DEFAULT_DOCUMENT_COUNT_PER_QUERY = 20;
const DUPLICATED_UNIQUE_FIELD_ERROR_CODE = 11000;
const MIN_PASSWORD_LENGTH = 8;
const MAX_DATABASE_TEXT_FIELD_LENGTH = 1e4;
const MAX_DOCUMENT_COUNT_PER_QUERY = 1e2;

const Schema = mongoose.Schema;

const MemberSchema = new Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: MIN_PASSWORD_LENGTH,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  },
  is_completed: {
    type: Boolean,
    default: false
  },
  name: {
    type: String,
    default: null,
    trim: true,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  }
});

MemberSchema.pre('save', hashPassword);

MemberSchema.statics.findMemberByIdAndFormat = function (id, callback) {
  const Member = this;

  if (!id || !validator.isMongoId(id.toString()))
    return callback('bad_request');

  Member.findById(mongoose.Types.ObjectId(id.toString()), (err, member) => {
    if (err) return callback('database_error');
    if (!member) return callback('document_not_found');

    formatMember(member, (err, member) => {
      if (err) return callback(err);

      return callback(null, member);
    });
  });
};

MemberSchema.statics.findMemberByEmailAndVerifyPassword = function (data, callback) {
  const Member = this;

  if (!data || typeof data != 'object')
    return callback('bad_request');

  if (!data.email || typeof data.email != 'string' || !validator.isEmail(data.email))
    return callback('bad_request');

  if (!data.password || typeof data.password != 'string')
    return callback('bad_request');

  Member.findOne({
    email: data.email.trim()
  }, (err, member) => {
    if (err) return callback('database_error');
    if (!member) return callback('document_not_found');

    verifyPassword(data.password.trim(), member.password, res => {
      if (!res) return callback('password_verification');

      formatMember(member, (err, member) => {
        if (err) return callback(err);

        return callback(null, member);
      });
    });
  });
};

MemberSchema.statics.createMember = function (data, callback) {
  const Member = this;

  if (!data || typeof data != 'object')
    return callback('bad_request');

  if (!data.email || typeof data.email != 'string' || !validator.isEmail(data.email) || !data.email.trim().length || data.email.length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');

  if (!data.password || typeof data.password != 'string' || data.password.trim().length < MIN_PASSWORD_LENGTH || data.password.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');

  const newMember = new Member({
    email: data.email,
    password: data.password
  });

  newMember.save((err, member) => {
    if (err && err.code == DUPLICATED_UNIQUE_FIELD_ERROR_CODE)
      return callback('duplicated_unique_field');
    if (err)
      return callback('database_error');

    formatMember(member, (err, member) => {
      if (err) return callback(err);

      return callback(null, member);
    });
  });
};

MemberSchema.statics.findMemberByIdAndUpdate = function (id, data, callback) {
  const Member = this;

  if (!id || !toMongoId(id))
    return callback('bad_request');

  const update = {};

  if (data.name && typeof data.name == 'string' && data.name.trim().length && data.name.trim().length <= MAX_DATABASE_TEXT_FIELD_LENGTH)
    update.name = data.name.trim();

  if (!Object.keys(update).length)
    return callback('bad_request');

  update.is_completed = true;

  Member.findByIdAndUpdate(toMongoId(id), { $set: update }, { new: true }, (err, member) => {
    if (err) return callback('database_error');
    if (!member) return callback('document_not_found');

    formatMember(member, (err, member) => {
      if (err) return callback(err);

      return callback(null, member);
    });
  });
};

MemberSchema.statics.findMemberByIdAndUpdatePassword = function (id, data, callback) {
  const Member = this;

  if (!id || !toMongoId(id))
    return callback('bad_request');

  if (!data || typeof data != 'object')
    return callback('bad_request');

  if (!data.password || typeof data.password != 'string' || data.password.trim().length < MIN_PASSWORD_LENGTH || data.password.trim().length > MAX_DATABASE_TEXT_FIELD_LENGTH)
    return callback('bad_request');

  Member.findById(toMongoId(id), (err, member) => {
    if (err) return callback('database_error');
    if (!member) return callback('document_not_found');

    member.password = data.password.trim();

    member.save((err, member) => {
      if (err) return callback('database_error');

      formatMember(member, (err, member) => {
        if (err) return callback(err);

        return callback(null, member);
      });
    });
  });
};

MemberSchema.statics.findMemberByIdAndDelete = function (id, callback) {
  const Member = this;

  if (!id || !toMongoId(id))
    return callback('bad_request');

  Member.findByIdAndDelete(toMongoId(id), (err, member) => {
    if (err) return callback('database_error');
    if (!member) return callback('document_not_found');

    formatMember(member, (err, member) => {
      if (err) return callback(err);

      return callback(null, member);
    });
  });
};

MemberSchema.statics.findMembersByFilters = function (data, callback) {
  const Member = this;

  if (!data || typeof data != 'object')
    return callback('bad_request');

  const limit = data.limit && !isNaN(parseInt(data.limit)) && parseInt(data.limit) > 0 && parseInt(data.limit) < MAX_DOCUMENT_COUNT_PER_QUERY ? parseInt(data.limit) : DEFAULT_DOCUMENT_COUNT_PER_QUERY;
  const page = data.page && !isNaN(parseInt(data.page)) && parseInt(data.page) > 0 ? parseInt(data.page) : 0;
  const skip = page * limit;
  let search = null;

  const filters = {};

  if (data.search && typeof data.search == 'string' && data.search.trim().length && data.search.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH) {
    search = data.search.trim();
    filters.$or = [
      { name: { $regex: data.search.trim(), $options: 'i' } },
      { email: { $regex: data.search.trim(), $options: 'i' } }
    ];
  }

  Member
    .find(filters)
    .sort({ email: 1 })
    .limit(limit)
    .skip(skip)
    .then(members => async.timesSeries(
      members.length,
      (time, next) => formatMember(members[time], (err, member) => next(err, member)),
      (err, members) => {
        if (err) return callback(err);

        return callback(null, {
          search,
          limit,
          page,
          members
        });
      })
    )
    .catch(_ => callback('database_error'));
};

MemberSchema.statics.findMemberCountByFilters = function (data, callback) {
  const Member = this;

  if (!data || typeof data != 'object')
    return callback('bad_request');

  const filters = {};

  if (data.search && typeof data.search == 'string' && data.search.trim().length && data.search.trim().length < MAX_DATABASE_TEXT_FIELD_LENGTH)
    filters.$or = [
      { name: { $regex: data.search.trim(), $options: 'i' } },
      { email: { $regex: data.search.trim(), $options: 'i' } }
    ];

  Member
    .find(filters)
    .countDocuments()
    .then(number => callback(null, number))
    .catch(_ => callback('database_error'));
};

module.exports = mongoose.model('Member', MemberSchema);
