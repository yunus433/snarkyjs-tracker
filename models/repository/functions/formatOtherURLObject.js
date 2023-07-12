const MAX_DATABASE_TEXT_FIELD_LENGTH = 1e4;
const URL_LIST = [
  'forks_url',
  'keys_url',
  'collaborators_url',
  'teams_url',
  'hooks_url',
  'issue_events_url',
  'events_url',
  'assignees_url',
  'branches_url',
  'tags_url',
  'blobs_url',
  'git_tags_url',
  'git_refs_url',
  'trees_url',
  'statuses_url',
  'languages_url',
  'stargazers_url',
  'contributors_url',
  'subscribers_url',
  'subscription_url',
  'commits_url',
  'git_commits_url',
  'comments_url',
  'issue_comment_url',
  'contents_url',
  'compare_url',
  'merges_url',
  'archive_url',
  'downloads_url',
  'issues_url',
  'pulls_url',
  'milestones_url',
  'notifications_url',
  'labels_url',
  'releases_url',
  'deployments_url',
  'created_at',
  'updated_at',
  'pushed_at',
  'git_url',
  'ssh_url',
  'clone_url',
  'svn_url',
  'mirror_url'
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