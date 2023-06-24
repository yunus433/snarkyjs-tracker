window.addEventListener('load', () => {
  const form = document.getElementById('form');
  const error = document.getElementById('error');

  form.onsubmit = event => {
    event.preventDefault();
    error.innerHTML = '';

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    serverRequest('/member/create', 'POST', {
      email,
      password
    }, res => {
      if (!res.success)
        return error.innerHTML = 'Something went wrong!';

      window.location = '/';
    });
  };
});