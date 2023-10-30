const toMongoId = require('../../../utils/toMongoId');

module.exports = data => {
  if (!data || typeof data != 'object')
    return null;

  if (!data.month)
    return null

  if (!data.is_total) {
    if (!data.developer_id || !toMongoId(data.developer_id))
      return null;

    return `${data.month}-${data.developer_id.toString()}`;
  } else {
    return `${data.month}-total`;
  }
}