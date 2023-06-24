module.exports = (req, res) => {
  return res.render('admin/index', {
    page: 'admin/index',
    title: 'Admin Login',
    includes: {
      external: {
        css: ['general', 'page'],
        js: ['page', 'serverRequest']
      }
    }
  });
}