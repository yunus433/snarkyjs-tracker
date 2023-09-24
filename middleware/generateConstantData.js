const REPOSITORES_SORT_OPTIONS = {
  'find_at': 'Find at',
  'title_lower': 'Title',
  'created_at': 'Created at',
  'pushed_at': 'Pushed at',
};
const DEVELOPERS_SORT_OPTIONS = {
  'find_at': 'Find at',
  'login_lower': 'Username',
};
const LANGUAGE_SEARCH_OPTIONS = ['Jupyter Notebook', 'JavaScript', 'OCaml', 'Solidity', 'TypeScript', 'Vue'];

module.exports = (req, res, next) => {
  res.locals.params = req.query;
  res.locals.REPOSITORES_SORT_OPTIONS = REPOSITORES_SORT_OPTIONS;
  res.locals.DEVELOPERS_SORT_OPTIONS = DEVELOPERS_SORT_OPTIONS;
  res.locals.LANGUAGE_SEARCH_OPTIONS = LANGUAGE_SEARCH_OPTIONS;

  return next();
}