module.exports = (req, res) => {
  return res.render('index/details', {
    page: 'index/details',
    title: 'Ticket Details',
    includes: {
      external: {
        css: ['general', 'page'],
        js: ['page', 'serverRequest']
      }
    }
  });
}