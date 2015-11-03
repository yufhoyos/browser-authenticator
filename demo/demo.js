// This is crap demo code. Forgive me.
(function (exports) {
  'use strict';

  window.addEventListener("load", function () {

    window.document.body.className += " in";

  });

var defaultKey = 'hxdm vjec jjws rb3h wizr 4ifu gftm xboz';
var key;
var Authenticator = exports.Authenticator;
var $ = function (x) {
  return document.querySelector(x);
};

function generate(ke) {
  Authenticator.generateKey().then(function (k) {
    var $keyEl = $('.js-key');
    if (ke) {
      key = ke;
    }
    else if ($keyEl.value) {
      key = $keyEl.value;
      $keyEl.placeholder = key;
      $keyEl.value = '';
    }
    else {
      key = k;
      $keyEl.placeholder = key;
    }

    var companyName = $('.js-company-name').value;
    var userAccount = $('.js-user-account').value;

    var otpauth = 'otpauth://totp/'
      + encodeURI(companyName) + ':' + encodeURI(userAccount)
      + '?secret=' + key.replace(/\s+/g, '').toUpperCase()
      ;
    // obviously don't use this in production, but it's not so bad for the demo
    // (hmm... no one has ever said those words and regretted them... TODO XXX generate QR locally)
    var src = 'https://chart.googleapis.com/chart?chs=166x166&chld=L|0&cht=qr&chl=' + encodeURIComponent(otpauth);

    $('.js-otpauth').innerHTML = otpauth; // only safe to inject because I created it
    $('img.js-qrcode').src = src;
    $('.js-otp-iframe').src = 'demo/phone.html?otpuri=' + encodeURIComponent(otpauth);

    Authenticator.generateToken(key).then(function (token) {
      console.log('token', token);

      Authenticator.verifyToken(key, token).then(function (result) {
        console.log('verify', result);

        Authenticator.verifyToken(key, '000 000').then(function (result) {
          console.log('reject', result);
        });
      });
    });
  });
}

$('.js-verify').addEventListener('click', function () {
  var token = $('.js-token').value;

  if (!/.*\d{3}.*\d{3}.*/.test(token)) {
    window.alert("must have a 6 digit token");
    return;
  }

  Authenticator.verifyToken(key, token).then(function (result) {
    var msg;
    if (result) {
      msg = 'Correct!';
    } else {
      msg = 'FAIL!';
    }

    console.info('verify', msg);
    window.alert(msg);
  }, function (err) {
    window.alert('[ERROR]:' + err.message);
    window.alert('[ERROR]:' + err.stack);

    console.error('ERROR');
    console.error(err);
  });
});

$('.js-generate').addEventListener('click', function () {
  generate(null);
});

$('.js-company-name').value = 'ACME Co';
$('.js-user-account').value = 'john@example.com';
$('.js-key').placeholder = defaultKey;
generate(defaultKey);

}(
  'undefined' !== typeof window ? window : module.exports
));
