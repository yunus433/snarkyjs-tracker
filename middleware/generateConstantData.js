const REPOSITORES_SORT_VALUES = ['find_at', 'created_at', 'title', 'pushed_at'];
const DEVELOPERS_SORT_VALUES = ['find_at', 'login'];
const LANGUAGE_SEARCH_VALUES = ['Jupyter Notebook', 'JavaScript', 'OCaml', 'Solidity', 'TypeScript', 'Vue'];

module.exports = (req, res, next) => {
  res.locals.params = req.query;
  res.locals.repositories_sort_values = REPOSITORES_SORT_VALUES;
  res.locals.developers_sort_values = DEVELOPERS_SORT_VALUES;
  res.locals.language_search_values = LANGUAGE_SEARCH_VALUES;

  return next();
}