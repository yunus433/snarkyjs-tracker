const getDeveloperByIdAndFormat = require('../../../utils/getDeveloperByIdAndFormat');

module.exports = (req, res) => {
  getDeveloperByIdAndFormat(req.query.id, (err, data) => {
    if (err) return res.redirect('/error?message=' + err);

    return res.render('developers/details', {
      page: 'developers/details',
      title: data.developer.login,
      includes: {
        external: {
          css: ['confirm', 'form', 'formPopUp', 'general', 'header', 'items', 'navbar', 'navigation', 'details', 'text'],
          js: ['createConfirm', 'createFormPopUp', 'navbarListeners', 'page', 'serverRequest']
        }
      },
      developer: {
        general_information: {
          columns: 3,
          username: data.developer.login,
          github_id: data.developer.github_id,
          node_id: data.developer.node_id,
          type: data.developer.type,
          site_admin: data.developer.site_admin,
          gravatar_id: data.developer.gravatar_id,
        },
        urls: {
          columns: 1,
          html_url: `https://github.com/'${data.developer.login}`,
          url: data.developer.url,
          avatar_url: data.developer.avatar_url,
          followers_url: data.developer.other_urls.followers_url,
          following_url: data.developer.other_urls.following_url,
          gists_url: data.developer.other_urls.gists_url,
          starred_url: data.developer.other_urls.starred_url,
          subscriptions_url: data.developer.other_urls.subscriptions_url,
          organizations_url: data.developer.other_urls.organizations_url,
          repos_url: data.developer.other_urls.repos_url,
          events_url: data.developer.other_urls.events_url,
          received_events_url: data.developer.other_urls.received_events_url,
        },
      },
      task_id: data.task_id
    });
  });
};