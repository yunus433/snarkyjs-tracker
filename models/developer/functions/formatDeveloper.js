module.exports = (developer, callback) => {
  if (!developer || !developer._id)
    return callback('document_not_found');

  return callback(null, {
    _id: developer._id.toString(),
    github_id: developer.github_id,
    login: developer.login,
    login_lower: developer.login_lower,
    node_id: developer.node_id,
    avatar_url: developer.avatar_url,
    gravatar_id: developer.gravatar_id,
    url: developer.url,
    other_urls: developer.other_urls,
    type: developer.type,
    site_admin: developer.site_admin
  });
};