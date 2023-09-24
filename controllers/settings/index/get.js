const Member = require('../../../models/member/Member');
const validator = require('validator');

module.exports = (req, res) => {
  Member.findMemberByIdAndFormat(req.session.member._id, (err, member) => {    
    if (err) return res.redirect('/error?message=' + err);

    return res.render('settings/index', {
      page: 'settings/index',
      title: member.name + ' - Edit Member',
      includes: {
        external: {
          css: ['confirm', 'create', 'form', 'formPopUp', 'general', 'header', 'items', 'navbar', 'navigation', 'text'],
          js: ['createConfirm', 'createFormPopUp', 'form', 'navbarListeners', 'page', 'serverRequest']
        }
      },
      member
    });
  });
};