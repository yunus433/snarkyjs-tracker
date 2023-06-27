// const async = require('async');
const mongoose = require('mongoose');
const validator = require('validator');

const hashPassword = require('./functions/hashPassword');
const verifyPassword = require('./functions/verifyPassword');

const DUPLICATED_UNIQUE_FIELD_ERROR_CODE = 11000;
const MIN_PASSWORD_LENGTH = 8;
const MAX_DATABASE_TEXT_FIELD_LENGTH = 1e4;

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
    minlength: MIN_PASSWORD_LENGTH,
    maxlength: MAX_DATABASE_TEXT_FIELD_LENGTH
  }
});

MemberSchema.pre('save', hashPassword);

MemberSchema.statics.findMemberByEmailAndVerifyPassword = function (data, callback) {
  const Member = this;

  if (!data || !data.email || !validator.isEmail(data.email) || !data.password)
    return callback('bad_request');

  Member.findOne({
    email: data.email.trim()
  }, (err, member) => {
    if (err) return callback('database_error');
    if (!member) return callback('document_not_found');

    verifyPassword(data.password.trim(), member.password, res => {
      if (!res) return callback('password_verification');

      return callback(null, member);
    });
  });

}

MemberSchema.statics.createMember = function (data, callback) {
  const Member = this;

  if (!data || typeof data != 'object')
    return callback('bad_request');

  if (!data.email || !validator.isEmail(data.email.toString()))
    return callback('email_validation');

  if (!data.password || data.password.toString().length < MIN_PASSWORD_LENGTH)
    return callback('password_validation');

  const newMemberData = {
    email: data.email.toString().trim(),
    password: data.password.toString().trim()
  };

  const newMember = new Member(newMemberData);

  newMember.save((err, member) => {
    if (err && err.code == DUPLICATED_UNIQUE_FIELD_ERROR_CODE)
      return callback('duplicated_unique_field');
    if (err)
      return callback('database_error');

    Member.collection
      .createIndex({ email: 1 }, { unique: true })
      .then(() => callback(null, member._id.toString()))
      .catch(() => callback('database_error'));
  });
};

module.exports = mongoose.model('Member', MemberSchema);
