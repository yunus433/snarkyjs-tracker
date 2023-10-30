const numberTo2DigitString = number => {
  if (!number || isNaN(number))
    return null;

  return number < 10 ? `0${number}` : `${number}`;
};

module.exports = date => {
  if (!date || isNaN(new Date(date)))
    return null;

  const year = (new Date(date)).getFullYear();
  const month = (new Date(date)).getMonth() + 1;

  if (!year || !month)
    return null;

  return `${year}-${numberTo2DigitString(month)}`
}