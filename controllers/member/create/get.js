module.exports = (req, res) => {
  return res.render('member/create', {
    page: 'member/create',
    title: 'Members',
    includes: {
      external: {
        css: ['general', 'page'],
        js: ['page', 'serverRequest']
      }
    }
  });
}