Package.describe({
  name: 'ostrio:cookies',
  version: '2.4.0',
  summary: 'Isomorphic bulletproof Server, Client, Browser and Cordova cookies',
  git: 'https://github.com/VeliovGroup/Meteor-Cookies',
  documentation: 'README.md'
});

Package.onUse((api) => {
  api.versionsFrom('1.4');
  api.use('ecmascript', ['client', 'server']);
  api.use('webapp', 'server');
  api.use('http', 'client');
  api.mainModule('cookies.js', ['client', 'server']);
});

Package.onTest((api) => {
  api.use('tinytest');
  api.use(['ecmascript', 'ostrio:cookies'], ['client', 'server']);
  api.use(['ejson', 'webapp'], 'server');
  api.addFiles('cookies-tests.js', ['client', 'server']);
});
