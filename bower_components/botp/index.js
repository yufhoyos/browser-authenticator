(function (exports, TEST) {
'use strict';

var crypto;
var sha1Hmac = exports.sha1Hmac || function (key, bytes) {
  if (!crypto) { crypto = require('crypto'); }

  var hmac = crypto.createHmac('sha1', new Buffer(key));
  // Update the HMAC with the byte array
  return hmac.update(new Buffer(bytes)).digest('hex');
};

/**
 * convert an integer to a byte array
 * @param {Integer} num
 * @return {Array} bytes
 */
function intToBytes(num) {
  var bytes = [];

  for(var i=7 ; i>=0 ; --i) {
    bytes[i] = num & (255);
    num = num >> 8;
  }

  return bytes;
}

/**
 * convert a hex value to a byte array
 * @param {String} hex string of hex to convert to a byte array
 * @return {Array} bytes
 */
function hexToBytes(hex) {
  var bytes = [];
  for(var c = 0, C = hex.length; c < C; c += 2) {
    bytes.push(parseInt(hex.substr(c, 2), 16));
  }
  return bytes;
}

var hotp = {};

/**
 * Generate a counter based One Time Password
 *
 * @return {String} the one time password
 *
 * Arguments:
 *
 *  args
 *     key - Key for the one time password.  This should be unique and secret for
 *         every user as this is the seed that is used to calculate the HMAC
 *
 *     counter - Counter value.  This should be stored by the application, must
 *         be user specific, and be incremented for each request.
 *
 */
hotp.gen = function(key, opt) {
  key = key || '';
  opt = opt || {};
  var counter = opt.counter || 0;

  // Create the byte array
  return sha1Hmac(key, intToBytes(counter)).then(function (digest) {
    // Get byte array
    var h = hexToBytes(digest);

    // Truncate
    var offset = h[19] & 0xf;
    var v = (h[offset] & 0x7f) << 24 |
      (h[offset + 1] & 0xff) << 16 |
      (h[offset + 2] & 0xff) << 8  |
      (h[offset + 3] & 0xff);

    v = (v % 1000000) + '';

    return new Array(7-v.length).join('0') + v;
  });
};

/**
 * Check a One Time Password based on a counter.
 *
 * @return {Object} null if failure, { delta: # } on success
 * delta is the time step difference between the client and the server
 *
 * Arguments:
 *
 *  args
 *     key - Key for the one time password.  This should be unique and secret for
 *         every user as it is the seed used to calculate the HMAC
 *
 *     token - Passcode to validate.
 *
 *     window - The allowable margin for the counter.  The function will check
 *         'W' codes in the future against the provided passcode.  Note,
 *         it is the calling applications responsibility to keep track of
 *         'W' and increment it for each password check, and also to adjust
 *         it accordingly in the case where the client and server become
 *         out of sync (second argument returns non zero).
 *         E.g. if W = 100, and C = 5, this function will check the passcode
 *         against all One Time Passcodes between 5 and 105.
 *
 *         Default - 50
 *
 *     counter - Counter value.  This should be stored by the application, must
 *         be user specific, and be incremented for each request.
 *
 */
hotp.verify = function(token, key, opt) {
  opt = opt || {};
  var window = opt.window || 50;
  var counter = opt.counter || 0;
  var i = counter - window;
  var len = counter + window;

  // Now loop through from C to C + W to determine if there is
  // a correct code
  function check(t) {
    opt.counter = i + 1;

    if (!t) {
      return null;
    }

    if (i > len) {
      return null;
    }

    if(t === token) {
      // We have found a matching code, trigger callback
      // and pass offset
      return i;
    }

    // TODO count 0, -1, 1, -2, 2, ... instead of -2, -1, 0, 1, ...
    i += 1;

    return hotp.gen(key, opt).then(check);
  }

  opt.counter = i;
  return hotp.gen(key, opt).then(check).then(function (i) {
    if('number' === typeof i) {
      return { delta: i - counter };
    }

    // If we get to here then no codes have matched, return null
    return null;
  });
};

var totp = {};

/**
 * Generate a time based One Time Password
 *
 * @return {String} the one time password
 *
 * Arguments:
 *
 *  args
 *     key - Key for the one time password.  This should be unique and secret for
 *         every user as it is the seed used to calculate the HMAC
 *
 *     time - The time step of the counter.  This must be the same for
 *         every request and is used to calculat C.
 *
 *         Default - 30
 *
 */
totp.gen = function(key, opt) {
  opt = opt || {};
  var time = opt.time || 30;
  var _t = Date.now();

  // Time has been overwritten.
  if(opt._t) {
    if(!TEST) {
      console.warn('Overwriting time in non-test environment!');
    }
    _t = opt._t;
  }

  // Determine the value of the counter, C
  // This is the number of time steps in seconds since T0
  opt.counter = Math.floor((_t / 1000) / time);

  return hotp.gen(key, opt);
};

/**
 * Check a One Time Password based on a timer.
 *
 * @return {Object} null if failure, { delta: # } on success
 * delta is the time step difference between the client and the server
 *
 * Arguments:
 *
 *  args
 *     key - Key for the one time password.  This should be unique and secret for
 *         every user as it is the seed used to calculate the HMAC
 *
 *     token - Passcode to validate.
 *
 *     window - The allowable margin for the counter.  The function will check
 *         'W' codes either side of the provided counter.  Note,
 *         it is the calling applications responsibility to keep track of
 *         'W' and increment it for each password check, and also to adjust
 *         it accordingly in the case where the client and server become
 *         out of sync (second argument returns non zero).
 *         E.g. if W = 5, and C = 1000, this function will check the passcode
 *         against all One Time Passcodes between 995 and 1005.
 *
 *         Default - 6
 *
 *     time - The time step of the counter.  This must be the same for
 *         every request and is used to calculate C.
 *
 *         Default - 30
 *
 */
totp.verify = function(token, key, opt) {
  opt = opt || {};
  var time = opt.time || 30;
  var _t = Date.now();

  // Time has been overwritten.
  if(opt._t) {
    if(!TEST) {
      console.warn('Overwriting time in non-test environment!');
    }
    _t = opt._t;
  }

  // Determine the value of the counter, C
  // This is the number of time steps in seconds since T0
  opt.counter = Math.floor((_t / 1000) / time);

  return hotp.verify(token, key, opt);
};

exports.hotp = hotp;
exports.totp = totp;
}(
  'undefined' !== typeof window ? window : module.exports
, 'undefined' !== typeof process ? process.env.NODE_ENV : false
));
