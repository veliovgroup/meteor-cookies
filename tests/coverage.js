import { Meteor } from 'meteor/meteor';

// SAVES ISTANBUL COVERAGE WHEN RUN VIA `npm run test:coverage` (tests/run-coverage.mjs)
// NO-OP IN REGULAR TEST RUNS
if (Meteor.isServer && process.env.COVERAGE_DIR) {
  const fs = require('fs');
  const path = require('path');
  const { WebApp } = require('meteor/webapp');
  const dir = process.env.COVERAGE_DIR;

  WebApp.connectHandlers.use('/___coverage___', (req, res) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'client.json'), body || '{}');
      fs.writeFileSync(path.join(dir, 'server.json'), JSON.stringify(globalThis.__coverage__ || {}));
      res.end('ok');
    });
  });
}

if (Meteor.isClient) {
  // REGISTERED LAST: RUNS AFTER ALL SERVER AND CLIENT TESTS
  Tinytest.addAsync('~ coverage: save', async (test) => {
    if (!window.__coverage__) {
      test.isTrue(true, 'Coverage disabled');
      return;
    }

    const response = await fetch(Meteor.absoluteUrl('___coverage___'), {
      method: 'POST',
      body: JSON.stringify(window.__coverage__)
    });
    test.isTrue(response.ok, 'Coverage saved');
  });
}
