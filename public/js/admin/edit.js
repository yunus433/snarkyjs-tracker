window.addEventListener('load', () => {
  const member = JSON.parse(document.getElementById('member-json').value);

  document.addEventListener('click', event => {
    if (event.target.id == 'update-button') {
      const error = document.getElementById('update-error');
      const name = document.getElementById('name').value;

      error.innerHTML = '';

      if (!name || !name.length)
        return error.innerHTML = 'Please enter a name for the member';

      serverRequest('/admin/edit?id=' + member._id, 'POST', {
        name
      }, res => {
        if (!res.success)
          return error.innerHTML = 'An error occured, please try again later. Error Message: ' + (res.error || 'unknown_error');

        return createConfirm({
          title: 'Member is Updated',
          text: 'Member account is updated. Close to reload the page.',
          accept: 'Close'
        }, _ => window.location.reload());
      });
    };

    if (event.target.id == 'reset-password-button') {
      const error = document.getElementById('reset-password-error');
      const password = document.getElementById('new-password').value;
      const confirmPassword = document.getElementById('confirm-password').value;

      error.innerHTML = '';

      if (!password || password.length < 8)
        return error.innerHTML = 'The new password must be at least 8 characters long.';

      if (password != confirmPassword)
        return error.innerHTML = 'Please confirm the new password.';

      serverRequest('/admin/password?id=' + member._id, 'POST', {
        password
      }, res => {
        if (!res.success)
          return error.innerHTML = 'An error occured, please try again later. Error Message: ' + (res.error || 'unknown_error');

        return createConfirm({
          title: 'Password Updated',
          text: 'Member password is updated. Close to reload the page.',
          accept: 'Close'
        }, _ => window.location.reload());
      });
    };
  });
});