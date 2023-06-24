window.addEventListener('load', () => {
  const form = document.getElementById('form');
  const error = document.getElementById('error');

  form.onsubmit = event => {
    event.preventDefault();
    error.innerHTML = '';

    const password = document.getElementById('password').value;

    serverRequest('/admin', 'POST', {
      password
    }, res => {
      if (!res.success)
        return error.innerHTML = 'Incorrect password';

      window.location = '/';
    });
  };
});