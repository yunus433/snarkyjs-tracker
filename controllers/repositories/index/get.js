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
            css: ['confirm', 'create', 'form', 'formPopUp', 'general', 'header', 'items', 'navbar', 'navigation', 'text'],
            js: ['createConfirm', 'createFormPopUp', 'form', 'navbarListeners', 'page', 'serverRequest']
          }
        },
        repositories_search: data.search,
        repositories_count: count,
        repositories_filters: data.filters,
        repositories_limit: data.limit,
        repositories_page: data.page,
        repositories_sort: data.sort,
        repositories_sort_order: data.sort_order,
        repositories: data.repositories,
        params: req.query
      });
    });
  });
};
