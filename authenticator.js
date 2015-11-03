(function (exports) {
'use strict';

var Authenticator = exports.Authenticator || exports;
var Unibabel = window.Unibabel; // || require('unibabel');
var totp = window.totp; // || require('notp').totp;

if (!window.crypto) {
  document.addEventListener('mousemove', function (event) {
    var ev = event || window.event;

    window.forge.random.collectInt(ev.pageX, 16);
    window.forge.random.collectInt(ev.pageY, 16);
  });
}

// Generate a key
function generateOtpKey() {
  // 20 cryptographically random binary bytes (160-bit key)
  try {
    var key = window.crypto.getRandomValues(new Uint8Array(20));

    return Promise.resolve(key);
  } catch(e) {
    // Promises are supported even in Microsoft Edge
    // only old IE and old android need shims
    return new Promise(function (resolve, reject) {
      window.forge.random.getBytes(20, function (err, bytes) {
        if (err) {
          reject(err);
          return;
        }

        resolve(Unibabel.binaryStringToBuffer(bytes));
      });
    });
  }
}

// Text-encode the key as base32 (in the style of Google Authenticator - same as Facebook, Microsoft, etc)
function encodeGoogleAuthKey(bin) {
  // 32 ascii characters without trailing '='s
  var base32 = (Unibabel||window).bufferToBase32(bin).replace(/=/g, '');

  // lowercase with a space every 4 characters
  var key = base32.toLowerCase().replace(/(\w{4})/g, "$1 ").trim();

  return key;
}

function generateGoogleAuthKey() {
  return generateOtpKey().then(encodeGoogleAuthKey);
}

// Binary-decode the key from base32 (Google Authenticator, FB, M$, etc)
function decodeGoogleAuthKey(key) {
  // decode base32 google auth key to binary
  var unformatted = key.replace(/\W+/g, '').toUpperCase();
  var bin = (Unibabel||window).base32ToBuffer(unformatted);

  return bin;
}

// Generate a Google Auth Token
function generateGoogleAuthToken(key) {
  var bin = decodeGoogleAuthKey(key);

  return totp.gen(bin);
}

// Verify a Google Auth Token
function verifyGoogleAuthToken(key, token) {
  var bin = decodeGoogleAuthKey(key);

  token = token.replace(/\W+/g, '');

  // window is +/- 1 period of 30 seconds
  return totp.verify(token, bin, { window: 1, time: 30 });
}

Authenticator.generateKey = generateGoogleAuthKey;
Authenticator.generateToken = generateGoogleAuthToken;
Authenticator.verifyToken = verifyGoogleAuthToken;
Authenticator.generateTotpUri = function (secret, accountName, issuer, algo, digits, period) {
  // Full OTPAUTH URI spec as explained at
  // https://github.com/google/google-authenticator/wiki/Key-Uri-Format
  return 'otpauth://totp/'
    + encodeURI(issuer || '') + ':' + encodeURI(accountName || '')
    + '?secret=' + secret.replace(/[\s\.\_\-]+/g, '').toUpperCase()
    + '&issuer=' + encodeURIComponent(issuer || '')
    + '&algorithm=' + (algo || 'SHA1')
    + '&digits=' + (digits || 6)
    + '&period=' + (period || 30)
    ;
};

}(
  'undefined' !== typeof window ? (window.Authenticator = {}) : module.exports
));
