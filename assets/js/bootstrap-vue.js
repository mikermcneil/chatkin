// Look up the appropriate vue page script and fire 'er up.
var pageName = document.body.getAttribute('data-page');
VUE_PAGES[pageName].el = VUE_PAGES[pageName].intendedEl;
delete VUE_PAGES[pageName].render;
VUE_PAGES[pageName].$mount();
