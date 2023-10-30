const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

module.exports = _date => {
  if (!_date || isNaN(new Date(_date)))
    return null;

  const date = new Date(_date);

  let next_month = date.getMonth() + 1;
  let next_year = date.getFullYear();

  if (next_month > 11) {
    next_month = 0;
    next_year++;
  }

  const next_month_first_day = new Date(`${next_year}-${next_month}`);
  const this_month_last_day = new Date(next_month_first_day.getTime() - ONE_DAY_IN_MS);

  return this_month_last_day.getDate();
};