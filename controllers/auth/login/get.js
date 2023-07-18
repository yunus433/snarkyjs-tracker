module.exports = (req, res) => {
  return res.render('auth/index', {
    page: 'auth/index',
    title: 'Login',
    includes: {
      external: {
        css: ['form', 'general', 'page', 'text'],
        js: ['page', 'serverRequest']
      }
    }
  });
}