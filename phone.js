(function (exports) {
  'use strict';

  $('body').addClass('in');

  var Authenticator = exports.Authenticator;

  function parseQuery(search) {

      var args = search.substring(1).split('&');

      var argsParsed = {};

      var i, arg, kvp, key, value;

      for (i=0; i < args.length; i++) {

          arg = args[i];

          if (-1 === arg.indexOf('=')) {

              argsParsed[decodeURIComponent(arg).trim()] = true;
          }
          else {

              kvp = arg.split('=');

              key = decodeURIComponent(kvp[0]).trim();

              value = decodeURIComponent(kvp[1]).trim();

              argsParsed[key] = value;
          }
      }

      return argsParsed;
  }

  function run() {
    var countdown = $(".js-countdown").countdown360({
      radius: 30,
      seconds: 30,
      fontColor: '#000',
      autostart: false,
      onComplete: function() {
        console.log('done');
        run();
      }
    });

    // TODO change to token start time, regardless of the time the app began
    countdown.start(new Date());
    console.log('countdown360 ', countdown);

    var otpauth = parseQuery(document.location.search).otpuri;
    var otplink = document.createElement('a');
    var otp;
    var meta;
    var issuer;
    var accountName;

    otplink.href = otpauth;
    otp = parseQuery(otplink.search);

    meta = otplink.pathname.replace(/.*\/totp\//, '').split(':');
    // TODO throw if otp.issuer !== decodeURI(meta[0])
    if (meta.length > 1) {
      // TODO why is there an extra leading '/' on iOS webview?
      issuer = otp.issuer || decodeURI(meta[0]).replace(/^\//, '');
      accountName = decodeURI(meta[1]);
    }
    else {
      issuer = otp.issuer;
      accountName = decodeURI(meta[0]);
    }

    $('.js-issuer').text(issuer);
    $('.js-account-name').text(accountName);

    Authenticator.generateToken(otp.secret).then(function (token) {
      $('.js-token').text(token.replace(/(\d{3})/g, '$1 ').trim());
    });
  }

  run();
}(window));
