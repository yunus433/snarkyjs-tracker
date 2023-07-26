const getDeveloperByIdAndFormat = require('../../../utils/getDeveloperByIdAndFormat');

module.exports = (req, res) => {
  getDeveloperByIdAndFormat(id, (err, data) => {
    if (err) return res.redirect('/error?message=' + err);

    return res.render('developers/details', {
      page: 'developers/details',
      title: data.developer.title,
      includes: {
        external: {
          css: ['confirm', 'form', 'formPopUp', 'general', 'header', 'items', 'navbar', 'navigation', 'text'],
          js: ['createConfirm', 'createFormPopUp', 'navbarListeners', 'page', 'serverRequest']
        }
      },
      developer: data.developer,
      task_id: data.task_id
    });
  });
};