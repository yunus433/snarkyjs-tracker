const fs = require('fs');
const path = require('path');

module.exports = (name, time, callback) => {
  if (!time || isNaN(time))
    return callback('bad_request');

  fs.writeFile(path.join(__dirname, `../data/${name}.txt`), time.toString().trim(), err => {
    if (err) return callback('fs_error');

    return callback(null);
  });
};