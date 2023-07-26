const json2csv = require('json2csv');

const Repository = require('../../../models/repository/Repository');

module.exports = (req, res) => {
  Repository.findRepositoriesByFilters(req.query, (err, data) => {
    if (err) return res.redirect('/error?message=' + err);

    json2csv.json2csv(data.repositories.map(each => {
      return {
        ["Identifier"]: each._id,
        ["Github Identifier"]: each.github_id,
        ["Title"]: each.title,
        ["URL"]: each.url
      };
    }), (err, csv) => {
      if (err) return res.redirect('/');

      return res.attachment(`SnarkyJS Project List - Page ${data.page}.csv`).send(csv);
    });
  });
};
