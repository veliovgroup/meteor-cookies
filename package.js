Package.describe({
  name: 'ostrio:cookies',
  version: '2.9.0',
  summary: 'Isomorphic bulletproof Server, Client, Browser, and Cordova cookies',
  git: 'https://github.com/veliovgroup/Meteor-Cookies',
  documentation: 'README.md'
});

Package.onUse((api) => {
  api.versionsFrom(['1.4', '3.0.1']);
  api.use('ecmascript', ['client', 'server']);
  api.use('webapp', 'server');
  api.use('fetch@0.1.5', 'client');
  api.mainModule('cookies.js', ['client', 'server']);

  // TypeScript setup
  api.use(['zodern:types@1.0.13', 'typescript'], ['client', 'server'], { weak: true });
  // For zodern:types to pick up our published types.
  api.addAssets('index.d.ts', ['client', 'server']);
});

Package.onTest((api) => {
  api.use('blaze-html-templates');
  api.use('tinytest');
  api.use(['ecmascript', 'http', 'ostrio:cookies@2.9.0'], ['client', 'server']);
  api.use(['ejson', 'webapp'], 'server');
  api.addFiles('tests/both.js', ['client', 'server']);
  api.addFiles('tests/server.js', 'server');
  api.addFiles('tests/client.js', 'client');
});
