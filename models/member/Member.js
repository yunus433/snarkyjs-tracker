const mongoose = require('mongoose');
const validator = require('validator');

const formatMember = require('./functions/formatMember');
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
    trim: true,
    minlength: MIN_PASSWORD_LENGTH,
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

module.exports = mongoose.model('Member', MemberSchema);
