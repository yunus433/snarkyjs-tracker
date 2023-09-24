const NOT_ALLOWED_CHARS = /[^\w\s\-_\./:]/gi;
const GITHUB_URL_REGEX = /^(https?:\/\/)?(www\.)?github\.com\/[\w\-_\.]+\/[\w\-_\.]+/i;

window.addEventListener('load', () => {
  const repositoryUrlsInput = document.getElementById('repository-urls');
  const addButtonError = document.getElementById('add-error');

  document.addEventListener('click', event => {
    if (event.target.closest('#add-button')) {
      let urls = repositoryUrlsInput.value.replace(/\s+/g, ' ').trim();

      addButtonError.innerHTML = '';
      if (NOT_ALLOWED_CHARS.test(urls)) {
        addButtonError.innerHTML = 'Invalid charachter in URL: ' + urls.match(NOT_ALLOWED_CHARS)[0];
        return;
      };

      const repositories = [];

      for (const url of urls.split(' ')) {
        if (GITHUB_URL_REGEX.test(url)) {
          let urlAsArray = url.split('github.com/');
          urlAsArray = urlAsArray[urlAsArray.length - 1].split('/');
          repositories.push({
            owner_name: urlAsArray[0],
            title: urlAsArray[1]
          });
        };
      };

      serverRequest('/repositories/add', 'POST', {
        repositories
      }, res => {
        if (!res.success)
          return addButtonError.innerHTML = 'An error occured, please try again later. Error Message: ' + (res.error || 'unknown_error');

        return createConfirm({
          title: 'Repositories Added',
          text: 'Repositories are added. Close to reload the page.',
          accept: 'Close'
        }, _ => window.location.reload());
      });
    };
  });
});