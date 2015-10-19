Package.describe({
  name: 'ostrio:cookies',
  version: '2.0.0',
  summary: 'Isomorphic boilerplate Server and Client cookie functions',
  git: 'https://github.com/VeliovGroup/Meteor-Cookies',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0');
  api.addFiles('cookies.coffee', ['client', 'server']);
  api.use(['coffeescript', 'underscore', 'random'], ['client', 'server']);
  api.use(['webapp', 'mongo'], 'server');
  api.use('http', 'client');

  api.export('Cookies');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use(['coffeescript', 'ostrio:cookies@2.0.0-beta'], ['client', 'server']);
  api.use(['underscore', 'ejson', 'webapp'], 'server');
  api.addFiles('cookies-tests.js', ['client', 'server']);
});
