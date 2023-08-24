module.exports = (req, res) => {
  return res.render('repositories/add', {
    page: 'repositories/add',
    title: 'Add Repository',
    includes: {
      external: {
        css: ['confirm', 'create', 'form', 'formPopUp', 'general', 'header', 'navbar', 'navigation', 'text'],
        js: ['createConfirm', 'createFormPopUp', 'navbarListeners', 'page', 'serverRequest']
      }
    },
  });
};