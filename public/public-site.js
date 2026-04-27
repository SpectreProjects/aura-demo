const dashboardSessionKey = 'auraDashboardEntered';

for (const link of document.querySelectorAll('.js-demo-link')) {
  link.addEventListener('click', () => {
    sessionStorage.setItem(dashboardSessionKey, 'true');
  });
}

for (const form of document.querySelectorAll('[data-local-form]')) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = form.querySelector('[data-form-message]');
    if (message) {
      message.textContent = form.dataset.successMessage || 'Submitted in demo mode.';
    }
    form.reset();
  });
}
