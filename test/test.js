const expect = require('chai').expect;
const keepass = require('../lib/index.js');

// TODO: add more tests

describe('itl', function () {
  it('should return a Promise with the login credentials', function (done) {
    keepass.itl({ url: 'example.com' })
      .then(results => {
        if (results && results.Entries) {
          done()
        } else {
          done(new Error('results field does not contain an Entries array'));
        }
      })
  });
});


