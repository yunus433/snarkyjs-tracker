module.exports = (req, res) => {
  const member = req.session.member;

  return res.render('index/index', {
    page: 'index/index',
    title: 'Admin Dashboard',
    includes: {
      external: {
        css: ['confirm', 'form', 'formPopUp', 'general', 'header', 'items', 'navbar', 'navigation', 'text'],
        js: ['createConfirm', 'createFormPopUp', 'navbarListeners', 'page', 'serverRequest']
      }
    },
    member
  });
}
