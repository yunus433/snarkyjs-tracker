const Developer = require('../../../models/developer/Developer');

module.exports = (req, res) => {
  Developer.findDeveloperCountByFilters(req.query, (err, count) => {
    if (err) return res.redirect('/error?message=' + err);

    Developer.findDevelopersByFilters(req.query, (err, data) => {
      if (err) return res.redirect('/error?message=' + err);
  
      return res.render('developers/index', {
        page: 'developers/index',
        title: 'Developers',
        includes: {
          external: {
            css: ['confirm', 'form', 'formPopUp', 'general', 'header', 'items', 'navbar', 'navigation', 'text'],
            js: ['createConfirm', 'createFormPopUp', 'navbarListeners', 'page', 'serverRequest']
          }
        },
        count,
        developers: data.developers,
        filters: data.filters,
        limit: data.limit,
        page: data.page,
        sort: data.sort,
        sort_order: data.sort_order
      });
    });
  });
};
