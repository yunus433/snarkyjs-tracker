module.exports = (repository, callback) => {
  if (!repository || !repository._id)
    return callback('document_not_found');

  return callback(null, {
    _id: repository._id.toString(),
    github_id: repository.github_id,
    latest_update_time: repository.latest_update_time,
    developer_id: repository.developer_id,
    title: repository.title,
    url: repository.url,
    description: repository.description,
    created_at: repository.created_at,
    pushed_at: repository.pushed_at,
    fork: repository.fork,
    other_urls: repository.other_urls,
    homepage: repository.homepage,
    size: repository.size,
    stargazers_count: repository.stargazers_count,
    watchers_count: repository.watchers_count,
    language: repository.language,
    has: repository.has,
    forks_count: repository.forks_count,
    archieved: repository.archieved,
    disabled: repository.disabled,
    open_issues_count: repository.open_issues_count,
    licence: repository.licence,
    allow_forking: repository.allow_forking,
    is_template: repository.is_template,
    topics: repository.topics,
    watchers: repository.watchers,
    default_branch: repository.default_branch,
    score: repository.score
  });
};