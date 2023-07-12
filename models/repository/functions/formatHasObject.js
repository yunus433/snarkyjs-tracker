const MAX_DATABASE_TEXT_FIELD_LENGTH = 1e4;
const HAS_LIST = [
  'issues',
  'projects',
  'downloads',
  'wiki',
  'pages',
  'discussions'
];

module.exports = data => {
  const has = {};

  if (!data || typeof data != 'object')
    return has;

  HAS_LIST.forEach(_prop => {
    const prop = `has_${_prop}`;

    if (data[prop] && typeof data[prop] == 'string' && data[prop].trim().length && data[prop].trim().length <= MAX_DATABASE_TEXT_FIELD_LENGTH)
      has[prop] = data[prop].trim();
  });

  return has;
}