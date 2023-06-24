module.exports = (req, res) => {
  return res.render('member/index', {
    page: 'member/index',
    title: 'Members',
    includes: {
      external: {
        css: ['general', 'page'],
        js: ['page', 'serverRequest']
      }
    }
  });
}