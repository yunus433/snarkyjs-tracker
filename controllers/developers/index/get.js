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
            css: ['confirm', 'create', 'form', 'formPopUp', 'general', 'header', 'items', 'navbar', 'navigation', 'text'],
            js: ['createConfirm', 'createFormPopUp', 'form', 'navbarListeners', 'page', 'serverRequest']
          }
        },
        developers_search: data.search,
        developers_count: count,
        developers_filters: data.filters,
        developers_limit: data.limit,
        developers_page: data.page,
        developers_sort: data.sort,
        developers_sort_order: data.sort_order,
        developers: data.developers,
      });
    });
  });
};
