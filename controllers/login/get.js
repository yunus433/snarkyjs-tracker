module.exports = (req, res) => {
  return res.render('index/login', {
    page: 'index/login',
    title: 'Login',
    includes: {
      external: {
        css: ['general', 'page'],
        js: ['page', 'serverRequest']
      }
    }
  });
}