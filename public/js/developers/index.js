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

  const sortByInputWrapper = document.getElementById('sort-by-radio');
  const orderInputWrapper = document.getElementById('order-radio');

  document.addEventListener('click', event => {
    if (event.target.closest('.general-radio-input-wrapper')) {
      const params = new URLSearchParams(window.location.search);

      params.set('sort', sortByInputWrapper.querySelector('.general-radio-input-box-selected').parentNode.dataset.value);
      params.set('sort_order', orderInputWrapper.querySelector('.general-radio-input-box-selected').parentNode.dataset.value);

      window.location.href = `/developers${params.toString().length ? '?' + params.toString() : ''}`;
    };
  });

});