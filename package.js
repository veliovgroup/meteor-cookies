Package.describe({
  name: 'ostrio:cookies',
  version: '0.0.1',
  summary: 'Boilerplate cookie functions',
  git: '',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0.3.1');
  api.addFiles('ostrio:cookies.coffee', 'client');
  api.use('coffeescript', ['client', 'server']);
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('ostrio:cookies');
  api.use('coffeescript', ['client', 'server']);
  api.addFiles('ostrio:cookies-tests.js', 'client');
});
