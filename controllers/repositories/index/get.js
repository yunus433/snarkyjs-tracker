const Repository = require('../../../models/repository/Repository');

module.exports = (req, res) => {
  Repository.findRepositoryCountByFilters(req.query, (err, count) => {
    if (err) return res.redirect('/error?message=' + err);

    Repository.findRepositoriesByFilters(req.query, (err, data) => {

      if (err) return res.redirect('/error?message=' + err);

      return res.render('repositories/index', {
        page: 'repositories/index',
        title: 'Repositories',
        includes: {
          external: {
            css: ['confirm', 'form', 'formPopUp', 'general', 'header', 'items', 'navbar', 'navigation', 'text'],
            js: ['createConfirm', 'createFormPopUp', 'navbarListeners', 'page', 'serverRequest']
          }
        },
        count,
        repositories: data.repositories,
        filters: data.filters,
        limit: data.limit,
        page: data.page,
        sort: data.sort,
        sort_order: data.sort_order
      });
    });
  });
};
