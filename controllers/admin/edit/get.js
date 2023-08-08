const Member = require('../../../models/member/Member');

module.exports = (req, res) => {
  Member.findMemberByIdAndFormat(req.query.id, (err, member) => {
    if (err) return res.redirect('/error?message=' + err);

    return res.render('admin/edit', {
      page: 'admin/edit',
      title: member.name + ' - Edit Member',
      includes: {
        external: {
          css: ['confirm', 'create', 'form', 'formPopUp', 'general', 'header', 'items', 'navbar', 'navigation', 'text'],
          js: ['adminListeners', 'ancestorWithClassName', 'createConfirm', 'createFormPopUp', 'form', 'page', 'serverRequest']
        }
      },
      navbar: {
        title: 'System Admin',
        subtitle: 'Create and edit member accounts.',
        logout: '/admin/logout',
        menu: [
          { name: 'All Members', link: '/admin' },
          { name: 'New Member', link: '/admin/create' }
        ]
      },
      member
    });
  });
};