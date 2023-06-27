module.exports = (req, res) => {
  return res.render('login/index', {
    page: 'login/index',
    title: 'Login',
    includes: {
      external: {
        css: ['general', 'page'],
        js: ['page', 'serverRequest']
      }
    }
  });
}