module.exports = (req, res) => {
  return res.render('index/index', {
    page: 'index/index',
    title: 'Home',
    includes: {
      external: {
        css: ['general', 'page'],
        js: ['page', 'serverRequest']
      }
    }
  });
}