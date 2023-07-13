const fs = require('fs');
const path = require('path');

module.exports = (name, callback) => {
  fs.readFile(path.join(__dirname, `../data/${name}.txt`), 'utf8', (err, data) => {
    if (err) return callback('fs_error');
    if (isNaN(Number(data)))
      return callback('unknown_error');

    return callback(null, Number(data));
  });
};