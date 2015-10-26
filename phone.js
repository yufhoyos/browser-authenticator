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

  /*
  function parseQuery(search) {
    var args = search.substring(1).split('&');
    var argsParsed = {};
    var i;

    console.log('parse args', args);
    for (i = 0; i < args.length; i++) {
      var arg = args[i];

      if (-1 === arg.indexOf('=')) {
        argsParsed[decodeURIComponent(arg).trim()] = true;
      }
      else {
        var kvp = arg.split('=');
        argsParsed[decodeURIComponent(kvp[0]).trim()] = decodeURIComponent(kvp[1]).trim();
      }
    }

    return argsParsed;
  }
  */

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
    console.log(document.location.search);

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
      issuer = otp.issuer || decodeURI(meta[0]);
      accountName = decodeURI(meta[1]);
    }
    else {
      issuer = otp.issuer;
      accountName = decodeURI(meta[0]);
    }

    console.log('otpuri', otpauth);
    console.log('otplink', otplink);
    console.log('otplink.search', otplink.search);
    console.log('otp', otp);

    $('.js-issuer').text(issuer);
    $('.js-account-name').text(accountName);
    Authenticator.generateToken(otp.secret).then(function (token) {
      $('.js-token').text(token.replace(/(\d{3})/g, '$1 ').trim());
    });
  }

  run();
}(window));
