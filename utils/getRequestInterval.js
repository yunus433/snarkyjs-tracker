const API_TOKENS = process.env.API_TOKENS.split(',');
const REQUEST_COUNT_PER_TOKEN_PER_HOUR = 5000;
const ONE_HOUR_IN_MS = 60 * 60 * 1000;

module.exports = () => {
  const apiTokenCount = Array.isArray(API_TOKENS) ? API_TOKENS.length : 1;

  return Math.round(ONE_HOUR_IN_MS / (REQUEST_COUNT_PER_TOKEN_PER_HOUR * apiTokenCount));
}