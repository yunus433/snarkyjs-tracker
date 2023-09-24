const converter = require('json-2-csv');

const Repository = require('../../../models/repository/Repository');

module.exports = (req, res) => {
  Repository.findRepositoriesByFilters(req.query, (err, data) => {
    if (err) return res.redirect('/error?message=' + err);

    converter.json2csv(data.repositories.map(each => {
      return {
        ["Identifier"]: each._id,
        ["Github Identifier"]: each.github_id,
        ["Title"]: each.title,
        ["URL"]: each.url
      };
    }), (err, csv) => {
      if (err) return res.redirect('/error?message=' + err);

      return res.attachment(`SnarkyJS Repository List - Page ${data.page}.csv`).send(csv);
    });
  });
};
