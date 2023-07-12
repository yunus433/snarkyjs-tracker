const MAX_DATABASE_OBJECT_KEY_COUNT = 1e3;
const TYPE_VALUES = ['query_repo', 'check_repo'];

module.exports = data => {
  if (!data || typeof data != 'object')
    return null;
  
  if (!data.type || typeof data.type != 'string' || !TYPE_VALUES.includes(data.type))
    return null;

  if (!data.data || typeof data.data != 'object' || !Object.keys(data.data).length || Object.keys(data.data).length > MAX_DATABASE_OBJECT_KEY_COUNT)
    return null;

  try {
    return `${data.type.trim()}-${JSON.stringify(data)}`;
  } catch (_) {
    return null;
  }
}