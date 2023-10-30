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
    found_at: repository.found_at,
    created_at: repository.created_at,
    last_pushed_at: repository.pushed_at,
    commit_count: repository.commit_count
  });
};