const API_TOKENS = process.env.API_TOKENS.split(',');
const REQUEST_COUNT_PER_TOKEN_PER_HOUR = 5000;
const ONE_HOUR_IN_MS = 60 * 60 * 1000;

module.exports = () => {
  return Math.round(ONE_HOUR_IN_MS / (REQUEST_COUNT_PER_TOKEN_PER_HOUR * API_TOKENS.length));
}