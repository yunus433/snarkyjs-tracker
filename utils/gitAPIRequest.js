const async = require('async');
const fetch = require('node-fetch');

const getRequestInterval = require('./getRequestInterval.js');

const API_TOKENS = process.env.API_TOKENS.split(',');
const DEFAULT_FILE_NAME_LIST = ['LICENCE', 'LICENSE', 'README.md', '.gitignore']
const MAX_FILE_COUNT_TO_CONSIDER = 1e5;
const MAX_PACKAGE_JSON_COUNT_TO_CONSIDER = 1e2;
const REPOSITORY_COUNT_PER_REQUEST = 100;
const REQUEST_INTERVAL = getRequestInterval();
const STATUS_CODES = {
  empty: 0,
  not_o1js: 1,
  o1js: 2
};
const SEARCH_FILE_NAME = 'package.json';
const SEARCH_FILE_KEYWORD_LIST = ['"o1js": "^', '"snarkyjs": "^'];
const SEARCH_LANGUAGES = ['Jupyter Notebook', 'JavaScript', 'OCaml', 'Solidity', 'TypeScript', 'Vue'];
const TYPE_VALUES = ['check', 'search'];

let apiTokenIndex = 0;
let lastSearchTime = null;

const getWaitTime = () => {
  if (!lastSearchTime) {
    lastSearchTime = Date.now();
    return 0;
  }

  const currentTime = Date.now();
  const waitTime = REQUEST_INTERVAL - (currentTime - lastSearchTime);

  lastSearchTime = currentTime;

  return waitTime > 0 ? waitTime : 0;
};

const formatOwner = owner => {
  try {
    return {
      github_id: owner.id.toString(),
      login: owner.login ? owner.login.toString() : null
    };
  } catch (_) {
    return null;
  };
};

const formatRepository = repo => {
  try {
    return {
      github_id: repo.id.toString(),
      owner: formatOwner(repo.owner),
      title: repo.name ? repo.name.toString() : null,
      url: repo.url ? repo.html_url.toString() : null,
      description: repo.description ? repo.description.toString() : null,
      created_at: repo.created_at ? repo.created_at.toString() : null,
      last_pushed_at: repo.pushed_at ? repo.pushed_at.toString() : null,
      default_branch: repo.default_branch ? repo.default_branch.toString() : null
    };
  } catch (err) {
    console.error(err);
    return null;
  };
};

const getAPIToken = () => {
  apiTokenIndex = (apiTokenIndex + 1) % API_TOKENS.length;
  return API_TOKENS[apiTokenIndex];
};

const getRepositories = (page, data, callback) => {
  fetch(`https://api.github.com/search/repositories?per_page=${REPOSITORY_COUNT_PER_REQUEST}&q=language:"${SEARCH_LANGUAGES.map(lang => lang.split(' ').join('+')).join('"+language:"')}"+pushed:${data.min_time}..${data.max_time}&page=${page}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAPIToken()}`
    }
  })
    .then(res => res.json())
    .then(res => {
      const repositories = res.items && Array.isArray(res.items) ? res.items : [];

      if (!res.total_count)
        return callback(null, []);
      if (res.total_count <= page * REPOSITORY_COUNT_PER_REQUEST)
        return callback(null, repositories.map(repo => formatRepository(repo)));

      setTimeout(() => {
        getRepositories(page + 1, data, (err, new_repositories) => {
          if (err) return callback(err);

          return callback(null, repositories.map(repo => formatRepository(repo)).concat(new_repositories));
        });
      }, getWaitTime());
    })
    .catch(err => {
      console.error("179 ", err)
      callback('fetch_error')
    });
};

const checkIsRepositoryo1js = (owner, title, default_branch, callback) => {
  fetch(`https://api.github.com/repos/${owner}/${title}/git/trees/${default_branch}?recursive=1`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAPIToken()}`
    }
  })
    .then(res => res.json())
    .then(res => {
      if (res.status == 404)
        return callback('document_not_found');
      if (!res.tree || !Array.isArray(res.tree))
        return callback('fetch_error');

      if (res.tree.length > MAX_FILE_COUNT_TO_CONSIDER)
        return callback(null, STATUS_CODES.not_o1js);

      const package_json_count = res.tree.filter(file => file.path && file.path.includes(SEARCH_FILE_NAME) && !file.path.includes('node_modules')).length;

      if (package_json_count > MAX_PACKAGE_JSON_COUNT_TO_CONSIDER)
        return callback(null, STATUS_CODES.not_o1js);

      if (!package_json_count && !res.tree.filter(file => file.path && !DEFAULT_FILE_NAME_LIST.find(any => file.path.includes(any))).length)
        return callback(null, STATUS_CODES.empty);

      async.timesSeries(
        res.tree.length,
        (time, next) => {
          const file = res.tree[time];
          
          if (!file.path || !file.path.includes(SEARCH_FILE_NAME) || file.path.includes('node_modules')) // Do not search for under node_modules
            return next(null);

          setTimeout(() => {
            fetch(`https://api.github.com/repos/${owner}/${title}/contents/${file.path}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAPIToken()}`
              }
            })
              .then(res => res.json())
              .then(res => {
                if (!res || !res.content || !res.content.length)
                  return next(null);

                const content = Buffer.from(res.content, 'base64').toString('utf8');
                
                if (SEARCH_FILE_KEYWORD_LIST.find(any => content.includes(any)))
                  return next('found_o1js_keyword_match');

                return next(null);
              })
              .catch(err => {
                console.log("HERERERER");
                console.log(err);
                next('fetch_error')
              });
          }, getWaitTime())
        },
        err => {
          if (err && err != 'found_o1js_keyword_match')
            return callback('fetch_error');

          if (err == 'found_o1js_keyword_match')
            return callback(null, STATUS_CODES.o1js);
          else
            return callback(null, STATUS_CODES.not_o1js);
        }
      );
    })
    .catch(err => {
      console.log(err);
      callback('fetch_error')});
};

const getRepositoryWithId = (github_id, callback) => {
  fetch(`https://api.github.com/repositories/${github_id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAPIToken()}`
    }
  })
    .then(res => res.json())
    .then(res => {
      if (!res.id)
        return callback('repository_deleted');

      return callback(null, formatRepository(res));
    })
    .catch(err => {
      console.log(err)
      callback('fetch_error')});
};

module.exports = (type, data, callback) => {
  if (!type || typeof type != 'string' || !TYPE_VALUES.includes(type))
    return callback('bad_request');

  if (!data || typeof data != 'object')
    return callback('bad_request');

  if (type == 'check') {
    if (!data.github_id || typeof data.github_id != 'string')
      return callback('bad_request');

    if (!data.owner || typeof data.owner != 'string')
      return callback('bad_request');

    if (!data.title || typeof data.title != 'string')
      return callback('bad_request');

    checkIsRepositoryo1js(data.owner, data.title, data.default_branch, (err, status) => {
      if (err && err != 'document_not_found') return callback(err);

      if (err) { // Repository URL may have been changed
        setTimeout(() => {
          getRepositoryWithId(data.github_id, (err, repository) => {
            if (err) return callback(err);
    
            setTimeout(() => {
              checkIsRepositoryo1js(repository.owner.login, repository.title, repository.default_branch, (err, status) => {
                if (err) return callback(err);
  
                if (status != STATUS_CODES.o1js)
                  return callback(null, {
                    status
                  });
    
                return callback(null, {
                  status,
                  repository
                });
              });
            }, getWaitTime());
          });
        }, getWaitTime());
      } else {
        if (status != STATUS_CODES.o1js)
          return callback(null, {
            status
          });

        setTimeout(() => {
          getRepositoryWithId(data.github_id, (err, repository) => {
            if (err) return callback(err);
    
            return callback(null, {
              status,
              repository
            });
          });
        }, getWaitTime());
      }
    });
  } else if (type == 'search') {
    if (!data.min_time || isNaN(new Date(data.min_time)))
      return callback('bad_request');

    if (!data.max_time || isNaN(new Date(data.max_time)))
      return callback('bad_request');

    if (new Date(data.min_time) > new Date(data.max_time))
      return callback('bad_request');

    data.min_time = new Date(data.min_time).toISOString().split('.')[0];
    data.max_time = new Date(data.max_time).toISOString().split('.')[0];

    getRepositories(1, data, (err, repositories) => {
      if (err) return callback(err);

      return callback(null, repositories);
    });
  } else {
    return callback('bad_request');
  }
};