window.addEventListener('load', () => {
  if (document.getElementById('repository-search-input')) {
    document.getElementById('repository-search-input').focus();
    document.getElementById('repository-search-input').select();

    document.getElementById('repository-search-input').addEventListener('keyup', event => {
      if (event.key == 'Enter' && event.target.value?.trim()?.length) {
        window.location = `/repositories?search=${event.target.value.trim()}`;
      } else if (event.key == 'Enter') {
        window.location = '/repositories';
      }
    });
  };

  const generalPageWrapper = document.querySelector('.general-page-wrapper');
  const generalItemsWrapper = document.querySelector('.general-items-wrapper');
  const generalCreateWrapper = document.querySelector('.general-create-wrapper');

  const generalHeaderAdvancedSearchButton = document.querySelector('.general-header-advanced-search-button');

  const titleInput = document.getElementById('title');
  const descriptionInput = document.getElementById('description');
  const languageInput = document.getElementById('language');
  const hasForkInput = document.getElementById('has-fork');

  const createdAfterInput = document.getElementById('created-after');
  const createdBeforeInput = document.getElementById('created-before');
  const pushedAfterInput = document.getElementById('pushed-after');
  const pushedBeforeInput = document.getElementById('pushed-before');

  const sortByInputWrapper = document.getElementById('sort-by-radio');
  const orderInputWrapper = document.getElementById('order-radio');

  document.addEventListener('click', event => {
    if (event.target.closest('.general-page-filter-remove-button')) {
      const params = new URLSearchParams(window.location.search);

      params.delete(event.target.closest('.general-page-filter-remove-button').dataset.filter);

      window.location.href = `/repositories${params.toString().length ? '?' + params.toString() : ''}`;
    } else if (event.target.closest('.general-header-advanced-search-button') || event.target.closest('.general-page-filter')) {
      generalPageWrapper.classList.toggle('display-none');
      generalItemsWrapper.classList.toggle('display-none');
      generalCreateWrapper.classList.toggle('display-none');
      generalHeaderAdvancedSearchButton.innerHTML = generalHeaderAdvancedSearchButton.innerHTML == 'Advanced Search' ? 'Cancel' : 'Advanced Search';
    } else if (event.target.closest('#advanced-search-button')) {
      const params = new URLSearchParams();

      if (titleInput.value.trim().length) {
        params.set('title', titleInput.value.trim());
      };

      if (descriptionInput.value.trim().length) {
        params.set('description', descriptionInput.value.trim());
      };

      if (languageInput.value.trim().length) {
        params.set('language', languageInput.value.trim());
      };

      if (hasForkInput.firstChild.classList.contains('general-checkbox-input-box-selected')) {
        params.set('fork', true);
      }

      if (createdAfterInput.value.trim().length) {
        params.set('created_after', createdAfterInput.value.trim());
      };

      if (createdBeforeInput.value.trim().length) {
        params.set('created_before', createdBeforeInput.value.trim());
      };

      if (pushedAfterInput.value.trim().length) {
        params.set('pushed_after', pushedAfterInput.value.trim());
      };

      if (pushedBeforeInput.value.trim().length) {
        params.set('pushed_before', pushedBeforeInput.value.trim());
      };

      if (sortByInputWrapper.querySelector('.general-radio-input-box-selected')) {
        params.set('sort', sortByInputWrapper.querySelector('.general-radio-input-box-selected').parentNode.dataset.value);
      };

      if (orderInputWrapper.querySelector('.general-radio-input-box-selected')) {
        params.set('sort_order', orderInputWrapper.querySelector('.general-radio-input-box-selected').parentNode.dataset.value);
      };

      window.location.href = `/repositories${params.toString().length ? '?' + params.toString() : ''}`;
    } else if (event.target.closest('.general-radio-input-wrapper')) {
      const params = new URLSearchParams(window.location.search);
  
      params.set('sort', sortByInputWrapper.querySelector('.general-radio-input-box-selected').parentNode.dataset.value);
      params.set('sort_order', orderInputWrapper.querySelector('.general-radio-input-box-selected').parentNode.dataset.value);
  
      window.location.href = `/repositories${params.toString().length ? '?' + params.toString() : ''}`;
    };
  });
});