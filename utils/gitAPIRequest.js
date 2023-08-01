const fetch = require('node-fetch');

const getRequestInterval = require('./getRequestInterval.js');

const API_TOKENS = process.env.API_TOKENS.split(',');
const SEARCH_KEYWORDS = ['mina', 'snarky', 'snarkyjs'];
const SEARCH_LANGUAGES = ['Jupyter Notebook', 'JavaScript', 'OCaml', 'Solidity', 'TypeScript', 'Vue'];
const REPOSITORY_COUNT_PER_REQUEST = 100;
const REQUEST_INTERVAL = getRequestInterval();
const STATUS_CODES = {
  indexing: 0,
  not_snarkyjs: 1,
  snarkyjs: 2
};
const TYPE_VALUES = ['force_repo_update', 'keyword_search', 'language_search', 'repo_update'];

let apiTokenIndex = 0;

const formatOwner = owner => {
  try {
    return {
      github_id: owner.id.toString(),
      login: owner.login ? owner.login.toString() : null,
      node_id: owner.node_id ? owner.node_id.toString() : null,
      avatar_url: owner.avatar_url ? owner.avatar_url.toString() : null,
      url: owner.url ? owner.url.toString() : null,
      followers_url: owner.followers_url ? owner.followers_url.toString() : null,
      following_url: owner.following_url ? owner.following_url.toString() : null,
      gists_url: owner.gists_url ? owner.gists_url.toString() : null,
      starred_url: owner.starred_url ? owner.starred_url.toString() : null,
      subscriptions_url: owner.subscriptions_url ? owner.subscriptions_url.toString() : null,
      organizations_url: owner.organizations_url ? owner.organizations_url.toString() : null,
      repos_url: owner.repos_url ? owner.repos_url.toString() : null,
      events_url: owner.events_url ? owner.events_url.toString() : null,
      received_events_url: owner.received_events_url ? owner.received_events_url.toString() : null,
      type: owner.type ? owner.type.toString() : null,
      site_admin: owner.site_admin
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
      fork: repo.fork,
      forks_url: repo.forks_url ? repo.forks_url.toString() : null,
      keys_url: repo.keys_url ? repo.keys_url.toString() : null,
      collaborators_url: repo.collaborators_url ? repo.collaborators_url.toString() : null,
      teams_url: repo.teams_url ? repo.teams_url.toString() : null,
      hooks_url: repo.hooks_url ? repo.hooks_url.toString() : null,
      issue_events_url: repo.issue_events_url ? repo.issue_events_url.toString() : null,
      events_url: repo.events_url ? repo.events_url.toString() : null,
      assignees_url: repo.assignees_url ? repo.assignees_url.toString() : null,
      branches_url: repo.branches_url ? repo.branches_url.toString() : null,
      tags_url: repo.tags_url ? repo.tags_url.toString() : null,
      blobs_url: repo.blobs_url ? repo.blobs_url.toString() : null,
      git_tags_url: repo.git_tags_url ? repo.git_tags_url.toString() : null,
      git_refs_url: repo.git_refs_url ? repo.git_refs_url.toString() : null,
      trees_url: repo.trees_url ? repo.trees_url.toString() : null,
      statuses_url: repo.statuses_url ? repo.statuses_url.toString() : null,
      languages_url: repo.languages_url ? repo.languages_url.toString() : null,
      stargazers_url: repo.stargazers_url ? repo.stargazers_url.toString() : null,
      contributors_url: repo.contributors_url ? repo.contributors_url.toString() : null,
      subscribers_url: repo.subscribers_url ? repo.subscribers_url.toString() : null,
      subscription_url: repo.subscription_url ? repo.subscription_url.toString() : null,
      commits_url: repo.commits_url ? repo.commits_url.toString() : null,
      git_commits_url: repo.git_commits_url ? repo.git_commits_url.toString() : null,
      comments_url: repo.comments_url ? repo.comments_url.toString() : null,
      issue_comment_url: repo.issue_comment_url ? repo.issue_comment_url.toString() : null,
      contents_url: repo.contents_url ? repo.contents_url.toString() : null,
      compare_url: repo.compare_url ? repo.compare_url.toString() : null,
      merges_url: repo.merges_url ? repo.merges_url.toString() : null,
      archive_url: repo.archive_url ? repo.archive_url.toString() : null,
      downloads_url: repo.downloads_url ? repo.downloads_url.toString() : null,
      issues_url: repo.issues_url ? repo.issues_url.toString() : null,
      pulls_url: repo.pulls_url ? repo.pulls_url.toString() : null,
      milestones_url: repo.milestones_url ? repo.milestones_url.toString() : null,
      notifications_url: repo.notifications_url ? repo.notifications_url.toString() : null,
      labels_url: repo.labels_url ? repo.labels_url.toString() : null,
      releases_url: repo.releases_url ? repo.releases_url.toString() : null,
      deployments_url: repo.deployments_url ? repo.deployments_url.toString() : null,
      created_at: repo.created_at ? repo.created_at.toString() : null,
      updated_at: repo.updated_at ? repo.updated_at.toString() : null,
      pushed_at: repo.pushed_at ? repo.pushed_at.toString() : null,
      git_url: repo.git_url ? repo.git_url.toString() : null,
      ssh_url: repo.ssh_url ? repo.ssh_url.toString() : null,
      clone_url: repo.clone_url ? repo.clone_url.toString() : null,
      svn_url: repo.svn_url ? repo.svn_url.toString() : null,
      mirror_url: repo.mirror_url ? repo.mirror_url.toString() : null,
      homepage: repo.homepage ? repo.homepage.toString() : null,
      size: Number(repo.size),
      stargazers_count: Number(repo.stargazers_count),
      watchers_count: Number(repo.watchers_count),
      language: repo.language ? repo.language.toString() : null,
      has_issues: repo.has_issues ? repo.has_issues.toString() : null,
      has_projects: repo.has_projects ? repo.has_projects.toString() : null,
      has_downloads: repo.has_downloads ? repo.has_downloads.toString() : null,
      has_wiki: repo.has_wiki ? repo.has_wiki.toString() : null,
      has_pages: repo.has_pages ? repo.has_pages.toString() : null,
      has_discussions: repo.has_discussions ? repo.has_discussions.toString() : null,
      forks_count: repo.forks_count ? Number(repo.forks_count) : Number(repo.forks),
      archieved: repo.archieved,
      disabled: repo.disabled,
      open_issues_count: repo.open_issues_count ? Number(repo.open_issues_count) : Number(repo.open_issues),
      licence: repo.licence,
      allow_forking: repo.allow_forking,
      is_template: repo.is_template,
      topics: repo.topics && Array.isArray(repo.topics) ? repo.topics.map(topic => topic.toString()) : [],
      watchers: !isNaN(Number(repo.watchers)) ? Number(repo.watchers) : null,
      default_branch: repo.default_branch ? repo.default_branch.toString() : null,
      score: repo.score ? repo.score.toString() : null
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

const getRepositoriesByKeywords = (page, data, callback) => {
  fetch(`https://api.github.com/search/repositories?per_page=${REPOSITORY_COUNT_PER_REQUEST}&q=${SEARCH_KEYWORDS.join('+OR+')}+pushed:${data.min_time}..${data.max_time}&page=${page}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAPIToken()}`
    }
  })
    .then(res => res.json())
    .then(res => {
      const repositories = res.items && Array.isArray(res.items) ? res.items : [];

      if (res.total_count <= page * REPOSITORY_COUNT_PER_REQUEST)
        return callback(null, repositories.map(repo => formatRepository(repo)));

      setTimeout(() => {
        getRepositoriesByKeywords(page + 1, data, (err, new_repositories) => {
          if (err) return callback(err);

          return callback(null, repositories.map(repo => formatRepository(repo)).concat(new_repositories));
        });
      }, REQUEST_INTERVAL);
    })
    .catch(err => {
      console.error("152 ", err);
      callback('fetch_error')
    });
};

const getRepositoriesByLanguage = (page, data, callback) => {
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

      if (res.total_count <= page * REPOSITORY_COUNT_PER_REQUEST)
        return callback(null, repositories.map(repo => formatRepository(repo)));

      setTimeout(() => {
        getRepositoriesByLanguage(page + 1, data, (err, new_repositories) => {
          if (err) return callback(err);

          return callback(null, repositories.map(repo => formatRepository(repo)).concat(new_repositories));
        });
      }, REQUEST_INTERVAL);
    })
    .catch(err => {
      console.error("179 ", err)
      callback('fetch_error')
    });
};

const isRepositoryIndexing = (data, callback) => {
  fetch(`https://api.github.com/search/code?q=repo:${data.owner_name}/${data.title}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAPIToken()}`
    }
  })
    .then(res => res.json())
    .then(res => {
      if (res.total_count == 0)
        return callback(null, true);

      return callback(null, false);
    })
    .catch(err => {
      console.error("200 ", err);
      callback('fetch_error')
    });
};

const getRepositoryWithCodeSearch = (data, callback) => {
  fetch(`https://api.github.com/search/code?q=snarkyjs+repo:${data.owner_name}/${data.title}+language:JSON`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAPIToken()}`
    }
  })
    .then(res => res.json())
    .then(res => {
      if (res.total_count == 0 || !res.items?.length)
        return callback(null, {
          status: STATUS_CODES.not_snarkyjs
        });

      return callback(null, {
        status: STATUS_CODES.snarkyjs,
        data: formatRepository(res.items[0].repository)
      });
    })
    .catch(err => {
      console.error("226 ", err);
      callback('fetch_error')
    });
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
      if (res.status != 200)
        return callback('document_not_found');

      return callback(null, res);
    })
    .catch(err => {
      console.error("246 ", err);
      callback('fetch_error')
    });
};

const hasRepositoryURLChanged = (data, callback) => {
  fetch(`https://github.com/${data.owner_name}/${data.title}`, {
    method: 'GET'
  })
    .then(res => {
      if (res.status == 404)
        return callback('document_not_found');
      else if (res.status != 200) {
        console.error("258 ", res);
        return callback('fetch_error');
      }

      if (res.url.includes(`${data.owner_name}/${data.title}`))
        return callback(null, false);

      return callback(null, true);
    })
    .catch(err => {
      console.error("267 ", err);
      callback('fetch_error')
    });
};

module.exports = (type, data, callback) => {
  if (!type || typeof type != 'string' || !TYPE_VALUES.includes(type))
    return callback('bad_request');

  if (!data || typeof data != 'object')
    return callback('bad_request');

  if (type == 'force_repo_update') { // This function is only called for snarkyjs repositories
    if (!data.github_id || typeof data.github_id != 'string')
      return callback('bad_request');

    if (!data.owner_name || typeof data.owner_name != 'string')
      return callback('bad_request');

    if (!data.title || typeof data.title != 'string')
      return callback('bad_request');

    getRepositoryWithId(data.github_id, (err, data) => {
      if (err) return callback(err);

      return callback(null, {
        status: STATUS_CODES.snarkyjs,
        data
      });
    });
  } else if (type == 'repo_update') {
    if (!data.github_id || typeof data.github_id != 'string')
      return callback('bad_request');

    if (!data.owner_name || typeof data.owner_name != 'string')
      return callback('bad_request');

    if (!data.title || typeof data.title != 'string')
      return callback('bad_request');

    hasRepositoryURLChanged(data, (err, res) => {
      if (err) return callback(err);

      if (res)
        getRepositoryWithId(data.github_id, (err, new_data) => {
          if (err) return callback(err);

          setTimeout(() => {
            getRepositoryWithCodeSearch({
              owner_name: new_data.owner.login,
              title: new_data.name
            }, (err, res) => {
              if (err) return callback(err);

              if (res.status == STATUS_CODES.snarkyjs)
                return callback(null, {
                  status: res.status,
                  data: res.data
                });

              setTimeout(() => {
                isRepositoryIndexing({
                  owner_name: new_data.owner.login,
                  title: new_data.name
                }, (err, res) => {
                  if (err) return callback(err);

                  if (res)
                    return callback(null, {
                      status: STATUS_CODES.indexing
                    });

                  return callback(null, {
                    status: STATUS_CODES.not_snarkyjs
                  });
                });
              }, REQUEST_INTERVAL);
            });
          }, REQUEST_INTERVAL);
        });
      else
        getRepositoryWithCodeSearch(data, (err, res) => {
          if (err) return callback(err);

          if (res.status == STATUS_CODES.snarkyjs)
            return callback(null, {
              status: res.status,
              data: res.data
            });

          setTimeout(() => {
            isRepositoryIndexing(data, (err, res) => {
              if (err) return callback(err);

              if (res)
                return callback(null, {
                  status: STATUS_CODES.indexing
                });

              return callback(null, {
                status: STATUS_CODES.not_snarkyjs
              });
            });
          }, REQUEST_INTERVAL);
        });
    });
  } else if (type == 'keyword_search' || type == 'language_search') {
    if (!data.min_time || isNaN(new Date(data.min_time)))
      return callback('bad_request');

    if (!data.max_time || isNaN(new Date(data.max_time)))
      return callback('bad_request');

    if (new Date(data.min_time) > new Date(data.max_time))
      return callback('bad_request');

    data.min_time = new Date(data.min_time).toISOString().split('.')[0];
    data.max_time = new Date(data.max_time).toISOString().split('.')[0];

    if (type == 'keyword_search')
      getRepositoriesByKeywords(1, data, (err, repositories) => {
        if (err) return callback(err);

        return callback(null, {
          data: repositories
        });
      });
    else
      getRepositoriesByLanguage(1, data, (err, repositories) => {
        if (err) return callback(err);

        return callback(null, {
          data: repositories
        });
      });
  } else {
    return callback('bad_request');
  }
};