window.addEventListener('load', () => {
  if (document.getElementById('developer-search-input')) {
    document.getElementById('developer-search-input').focus();
    document.getElementById('developer-search-input').select();

    document.getElementById('developer-search-input').addEventListener('keyup', event => {
      if (event.key == 'Enter' && event.target.value?.trim()?.length) {
        window.location = `/developers?search=${event.target.value.trim()}`;
      } else if (event.key == 'Enter') {
        window.location = '/developers';
      }
    });
  };
});