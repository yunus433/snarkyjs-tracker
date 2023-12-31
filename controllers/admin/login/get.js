module.exports = (req, res) => {
  return res.render('admin/login', {
    page: 'admin/login',
    title: 'System Admin Log In',
    includes: {
      external: {
        css: ['form', 'general', 'page', 'text'],
        js: ['page', 'serverRequest']
      }
    }
  });
};
