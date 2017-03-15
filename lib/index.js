/**
 * Node.js module to retrieve credentials from KeepPass, using the KeePassHTTP plugin
 * 
 * Code based on https://github.com/belaviyo/keepass-macpass-helper
 * Keepass HTTP protocol documentation - https://github.com/pfn/keepasshttp
 */

const sjcl = require('sjcl-all');
const nconf = require('nconf');
const rp = require('request-promise-native');

sjcl.beware["CBC mode is dangerous because it doesn't protect message integrity."]();

let port;
let key;
let id;

function generateKey(len = 16) {
  const iv = [];
  for (let i = 0; i < len; i += 1) {
    iv.push(String.fromCharCode(Math.floor(Math.random() * 256)));
  }
  return new Buffer(iv.join(''), 'binary').toString('base64');
}

function encrypt(data, iv) {
  const enc = sjcl.mode.cbc.encrypt(
    new sjcl.cipher.aes(sjcl.codec.base64.toBits(key)),
    sjcl.codec.utf8String.toBits(data),
    sjcl.codec.base64.toBits(iv)
  );
  return sjcl.codec.base64.fromBits(enc);
}

function decrypt(data, iv) {
  const dec = sjcl.mode.cbc.decrypt(
    new sjcl.cipher.aes(sjcl.codec.base64.toBits(key)),
    sjcl.codec.base64.toBits(data),
    sjcl.codec.base64.toBits(iv)
  );
  return sjcl.codec.utf8String.fromBits(dec);
}

function verify(request) {
  const nonce = generateKey();
  request.Nonce = nonce;
  request.Verifier = encrypt(nonce, nonce);
  if (id) {
    request.Id = id;
  }
  return request;
}

function post(request) {
  return rp({
    method: 'POST',
    uri: `http://localhost:${port}`,
    body: request,
    json: true,
  });
}

function init() {
  nconf.file({ file: '.keepass' });

  nconf.defaults({
    port: 19455,
  });

  port = nconf.get('port');
  key = nconf.get('key');
  id = nconf.get('id');

  if (!key) {
    key = generateKey(32);
    nconf.set('key', key);
    nconf.save();
  }
  return Promise.resolve();
}

function test() {
  let request = {
    RequestType: 'test-associate',
    TriggerUnlock: false,
  };
  request = verify(request);
  return post(request)
    .then((response) => {
      if (response && response.Success) {
        return response;
      }
      throw new Error(response);
    });
}

function associate() {
  let request = {
    RequestType: 'associate',
    Key: key,
  };
  request = verify(request);
  return post(request)
    .then((response) => {
      if (response && response.Success) {
        id = response.Id;
        nconf.set('id', id);
        nconf.save();
        return response;
      }
      throw new Error(response);
    });
}

function logins({ url, submiturl, realm }) {
  if (!url) {
    throw new Error('URL paramter is missing.');
  }

  let request = {
    RequestType: 'get-logins',
    TriggerUnlock: 'false',
    SortSelection: 'false',
  };
  request = verify(request);
  const iv = request.Nonce;
  request.Url = encrypt(url, iv);
  if (submiturl) {
    request.SubmitUrl = this.encrypt(submiturl, iv);
  }
  if (realm) {
    request.Realm = this.encrypt(realm, iv);
  }

  return post(request)
    .then((response) => {
      if (response && response.Entries) {
        const nonce = response.Nonce;
        response.Entries = response.Entries.map(entry =>
          Object.assign(entry, {
            Login: decrypt(entry.Login, nonce),
            Name: decrypt(entry.Name, nonce),
            Password: decrypt(entry.Password, nonce),
          }));
        return response;
      }
      throw new Error(response);
    });
}

// itl: init -> test -> logins

function itl(params) {
  return init()
    .then(test)
    .then(() => logins(params))
    .catch(() =>
      associate()
        .then(() => logins(params))
    );
}

module.exports = {
  init,
  test,
  associate,
  logins,
  itl,
};
