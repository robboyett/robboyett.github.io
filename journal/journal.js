(function () {
    const page = document.querySelector('.page');
    const siteNav = document.querySelector('site-nav');

    if (page && siteNav) {
        siteNav.addEventListener('menu-open', () => {
            page.classList.add('menu-open');
        });

        siteNav.addEventListener('menu-close', () => {
            page.classList.remove('menu-open');
        });
    }

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
            document.documentElement.classList.add('fonts-loaded');
        });
    } else {
        document.documentElement.classList.add('fonts-loaded');
    }
})();
