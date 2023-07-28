const getRepositoryByIdAndFormat = require('../../../utils/getRepositoryByIdAndFormat');

module.exports = (req, res) => {
  getRepositoryByIdAndFormat(req.query.id, (err, data) => {
    if (err) return res.redirect('/error?message=' + err);

    return res.render('repositories/details', {
      page: 'repositories/details',
      title: data.repository.title,
      includes: {
        external: {
          css: ['confirm', 'form', 'formPopUp', 'general', 'header', 'items', 'navbar', 'navigation', 'text'],
          js: ['createConfirm', 'createFormPopUp', 'navbarListeners', 'page', 'serverRequest']
        }
      },
      repository: data.repository,
      task_id: data.task_id
    });
  });
};