const Member = require('../../../models/member/Member');

module.exports = (req, res) => {
  Member.findMemberCountByFilters(req.query, (err, count) => {
    if (err) return res.redirect('/error?message=' + err);

    Member.findMembersByFilters(req.query, (err, data) => {
      if (err) return res.redirect('/error?message=' + err);

      return res.render('admin/index', {
        page: 'admin/index',
        title: 'Members Dashboard',
        includes: {
          external: {
            css: ['confirm', 'form', 'formPopUp', 'general', 'header', 'items', 'navbar', 'navigation', 'text'],
            js: ['adminListeners', 'createConfirm', 'createFormPopUp', 'page', 'serverRequest']
          }
        },
        navbar: {
          title: 'System Admin',
          subtitle: 'Create and edit member accounts.',
          logout: '/admin/logout',
          menu: {
            'Members': [
              { name: 'All Members', link: '/admin', selected: true },
              { name: 'New Member', link: '/admin/create' }
            ]
          }
        },
        members_count: count,
        members_search: data.search,
        members_limit: data.limit,
        members_page: data.page,
        members: data.members
      });
    });
  });
};
