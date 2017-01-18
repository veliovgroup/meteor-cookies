Package.describe({
  name: 'ostrio:cookies',
  version: '2.1.0',
  summary: 'Isomorphic bulletproof Server and Client cookie functions',
  git: 'https://github.com/VeliovGroup/Meteor-Cookies',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.4');
  api.use(['ecmascript', 'underscore'], ['client', 'server']);
  api.use('webapp', 'server');
  api.use('http', 'client');
  api.mainModule('cookies.js', ['client', 'server']);
  api.export('Cookies');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use(['ecmascript', 'ostrio:cookies'], ['client', 'server']);
  api.use(['underscore', 'ejson', 'webapp'], 'server');
  api.addFiles('cookies-tests.js', ['client', 'server']);
});
