window.addEventListener('load', () => {
  document.getElementById('member-search-input').focus();
  document.getElementById('member-search-input').select();

  document.addEventListener('click', event => {
    if (event.target.classList.contains('each-navbar-group-link') && event.target.href?.includes('/admin/create')) {
      event.preventDefault();

      createFormPopUp({
        title: 'Create a New Member',
        url: '/admin/create',
        method: 'POST',
        description: 'You will be asked to complete member details & change the password once you create it.',
        inputs: [
          {
            name: 'email',
            placeholder: 'Email'
          }
        ],
        button: 'Create New Member',
        errors: {
          duplicated_unique_field: 'Each member must have a unique email'
        }
      }, (error, res) => {
        if (error) return alert(error);
        if (!res) return;

        console.log(res.member);

        return window.location = '/admin/edit?id=' + res.member._id;
      });
    }
  });

  document.getElementById('member-search-input').addEventListener('keyup', event => {
    if (event.key == 'Enter' && event.target.value?.trim()?.length) {
      window.location = `/admin?search=${event.target.value.trim()}`;
    } else if (event.key == 'Enter') {
      window.location = '/admin';
    }
  });
});