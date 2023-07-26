const json2csv = require('json2csv');

const Developer = require('../../../models/developer/Developer');

module.exports = (req, res) => {
  Developer.findDevelopersByFilters(req.query, (err, data) => {
    if (err) return res.redirect('/error?message=' + err);

    json2csv.json2csv(data.developers.map(each => {
      return {
        ["Identifier"]: each._id,
        ["Github Identifier"]: each.github_id,
        ["Username"]: each.login,
        ["URL"]: each.url
      };
    }), (err, csv) => {
      if (err) return res.redirect('/');

      return res.attachment(`SnarkyJS Developer List - Page ${data.page}.csv`).send(csv);
    });
  });
};
