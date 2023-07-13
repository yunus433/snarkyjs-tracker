const { set } = require('mongoose');
const fetch = require('node-fetch');

const ITEM_COUNT_PER_PAGE = 100;
const LANGUAGES = ['TypeScript', 'JavaScript', 'Vue', 'OCaml', 'Solidity', 'Jupyter Notebook'];
const REQUEST_INTERVAL = 2000;
const TYPE_VALUES = ['force_repo_update', 'keyword_search', 'language_search', 'repo_update'];

const formatRepository = (repo) => {
  return {
    github_id: repo.id,
    latest_update_time: new Date(repo.updated_at).getTime(),
    developer_id: repo.owner.id,
    title: repo.name,
    url: repo.html_url,
    description: repo.description,
    fork: repo.fork,
    other_urls: {},
    homepage: repo.homepage,
    size: repo.size,
    stargazers_count: repo.stargazers_count,
    watchers_count: repo.watchers_count,
    language: repo.language,
    has: {},
    forks_count: repo.forks_count,
    archieved: repo.archieved,
    disabled: repo.disabled,
    open_issues_count: repo.open_issues_count,
    licence: {},
    allow_forking: repo.allow_forking,
    is_template: repo.is_template,
    topics: repo.topics,
    watchers: repo.watchers,
    default_branch: repo.default_branch,
    score: repo.score
  };
};

const getRepositoriesByLanguage = (page, data) => {
  fetch(`https://api.github.com/search/repositories?q=${LANGUAGES.forEach(lang => `language:"${lang.replace(' ', '+')}"+`)}&per_page=100&created:${data.min_time}..${data.max_time}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `token ${process.env.GITHUB_TOKEN}`
    }
  }, (err, res) => {
    if (err) return callback('fetch_error');

    if (res.total_count <= page * ITEM_COUNT_PER_PAGE)
      return callback(null, {
        success: true,
        data: res.items.map(repo => formatRepository(repo))
      });

    setTimeout(() => {
      return res.items.map(repo => formatRepository(repo)).concat(getRepositoriesByLanguage(page + 1, data));
    }, REQUEST_INTERVAL);
  });
};

const getRepositoriesByKeywords = (page, data) => {
  fetch(`https://api.github.com/search/repositories?per_page=100&q=snarkyjs+OR+snarky+OR+mina+created:${data.min_time}..${data.max_time}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `token ${process.env.GITHUB_TOKEN}`
    }
  }, (err, res) => {
    if (err) return callback(err);

    if (res.total_count <= page * ITEM_COUNT_PER_PAGE)
      return callback(null, {
        success: true,
        data: res.items.map(repo => formatRepository(repo))
      });

    setTimeout(() => {
      return res.items.map(repo => formatRepository(repo)).concat(getRepositoriesByKeywords(page + 1, data));
    }, REQUEST_INTERVAL);
  });
};

const getRepositoryHTML = (data, callback) => {
  fetch(`https://github.com/${data.owner_name}/${data.title}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  }, (err, res) => {
    if (err) return callback('fetch_error');

    if (res.status == 404)
      return callback(null, {
        success: false,
        data: null
      });

    if (res.status == 200)
      if (res.timingInfo.redirectEndTime == 0)
        return getRepositoryWithCodeSearch(data, (err, res) => {
          if (err) return callback(err);

          return callback(null, res);
        });
      else
        return getRepositoryWithId(data, (err, res) => {
          if (err) return callback(err);

          setTimeout(() => {
            return getRepositoryWithCodeSearch(res, (err, res) => {
              if (err) return callback(err);

              return callback(null, res);
            });
          }, REQUEST_INTERVAL);
        });
  });
};

const getRepositoryWithCodeSearch = (data, callback) => {
  fetch(`https://api.github.com/search/code?q=snarkyjs+repo:${data.owner_name}/${data.title}+language:JSON`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `token ${process.env.GITHUB_TOKEN}`
    }
  }, (err, res) => {
    if (err) return callback('fetch_error');

    if (res.total_count == 0)
      return callback(null, {
        success: false,
        data: null
      });

    if (res.total_count > 0)
      return callback(null, {
        success: true,
        data: formatRepository(res.items[0])
      });
  });
};

const getRepositoryWithId = (data, callback) => {
  fetch(`https://api.github.com/repositories/${data.git_id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `token ${process.env.GITHUB_TOKEN}`
    }
  }, (err, res) => {
    if (err) return callback('fetch_error');

    if (res.status != 200)
      return callback(null, {
        success: false,
        data: null
      });

    if (res.status == 200) {
      data.owner_name = res.owner.login;
      data.title = res.name;
    };

    return (null, data);
  });
};

module.exports = (type, data, callback) => {
  if (!type || typeof type != 'string' || !TYPE_VALUES.includes(type))
    return callback('bad_request');

  if (!data || typeof data != 'object')
    return callback('bad_request');

  if (type == 'force_repo_update' || type == 'repo_update') {
    if (!data.git_id || typeof data.git_id != 'string')
      return callback('bad_request');

    if (!data.owner_name || typeof data.owner_name != 'string')
      return callback('bad_request');

    if (!data.title || typeof data.title != 'string')
      return callback('bad_request');

    getRepositoryHTML(data, (err, res) => {
      if (err) return callback(err);

      return callback(null, res);
    });
  }
  else if (type == 'keyword_search' || type == 'language_search') {
    if (!data.min_time || !isNaN(new Date(data.min_time)))
      return callback('bad_request');

    if (!data.max_time || !isNaN(new Date(data.max_time)))
      return callback('bad_request');

    if (new Date(data.min_time) > new Date(data.max_time))
      return callback('bad_request');

    data.min_time = new Date(data.min_time).toISOString().split('.')[0];
    data.max_time = new Date(data.max_time).toISOString().split('.')[0];

    if (type == 'keyword_search') {
      return callback(null, {
        success: true,
        data: getRepositoriesByKeywords(1, data)
      });
    };

    if (type == 'language_search')
      return callback(null, {
        success: true,
        data: getRepositoriesByLanguage(1, data)
      });
  }
  else
    return callback('bad_request');
};