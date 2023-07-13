const MAX_DATABASE_TEXT_FIELD_LENGTH = 1e4;
const URL_LIST = [
  'followers_url',
  'following_url',
  'gists_url',
  'starred_url',
  'subscriptions_url',
  'organizations_url',
  'repos_url',
  'events_url',
  'received_events_url'
];

module.exports = data => {
  const urls = {};

  if (!data || typeof data != 'object')
    return urls;

  URL_LIST.forEach(url => {
    if (data[url] && typeof data[url] == 'string' && data[url].trim().length && data[url].trim().length <= MAX_DATABASE_TEXT_FIELD_LENGTH)
      urls[url] = data[url].trim();
  });

  return urls;
}