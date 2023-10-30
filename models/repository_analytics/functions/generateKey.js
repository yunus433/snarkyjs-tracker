const toMongoId = require('../../../utils/toMongoId');

module.exports = data => {
  if (!data || typeof data != 'object')
    return null;

  if (!data.month)
    return null

  if (!data.is_total) {
    if (!data.repository_id || !toMongoId(data.repository_id))
      return null;

    return `${data.month}-${data.repository_id.toString()}`;
  } else {
    return `${data.month}-total`;
  }
}