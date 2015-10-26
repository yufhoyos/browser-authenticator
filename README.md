# Browser Authenticator

Two- / Multi- Factor Authenication (2FA / MFA) for browser JavaScript

[![](http://i.imgur.com/sdvMdbo.png)](https://daplie.github.io/browser-authenticator/)
<!-- ![](https://blog.authy.com/assets/posts/authenticator.png) -->

There are a number of apps that various websites use to give you 6-digit codes to increase security when you log in:

* [Authy](https://www.authy.com/personal/) (shown above) [iPhone](https://itunes.apple.com/us/app/authy/id494168017?mt=8) | [Android](https://play.google.com/store/apps/details?id=com.authy.authy&hl=en) | [Chrome](https://chrome.google.com/webstore/detail/authy/gaedmjdfmmahhbjefcbgaolhhanlaolb?hl=en) | [Linux](https://www.authy.com/personal/) | [OS X](https://www.authy.com/personal/) | [BlackBerry](https://appworld.blackberry.com/webstore/content/38831914/?countrycode=US&lang=en)
* Google Authenticator [iPhone](https://itunes.apple.com/us/app/google-authenticator/id388497605?mt=8) | [Android](https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2&hl=en)
* Microsoft Authenticator [Windows Phone](https://www.microsoft.com/en-us/store/apps/authenticator/9wzdncrfj3rj) | [Android](https://play.google.com/store/apps/details?id=com.microsoft.msa.authenticator)
* GAuth [FxOS](https://marketplace.firefox.com/app/gauth/)

There are many [Services that Support MFA](http://lifehacker.com/5938565/heres-everywhere-you-should-enable-two-factor-authentication-right-now),
including Google, Microsoft, Facebook, and Digital Ocean for starters.

This module uses [`botp`](https://github.com/Daplie/botp) which implements `TOTP` [(RFC 6238)](https://www.ietf.org/rfc/rfc6238.txt)
(the *Authenticator* standard), which is based on `HOTP` [(RFC 4226)](https://www.ietf.org/rfc/rfc4226.txt)
to provide codes that are exactly compatible with all other *Authenticator* apps and services that use them.

Demo
====

[Live Demo](https://daplie.github.io/browser-authenticator/) at <https://daplie.github.io/browser-authenticator/>

You may also be interested in [Node Authenticator](https://github.com/Daplie/node-authenticator) over at <https://github.com/Daplie/node-authenticator>

Usage
=====

```bash
bower install authenticator --save
```

```javascript
'use strict';

var authenticator = window.Authenticator;

authenticator.generateKey().then(function (formattedKey) {
  // "acqo ua72 d3yf a4e5 uorx ztkh j2xl 3wiz"

  authenticator.generateToken(formattedKey).then(function (formattedToken) {
    // "957 124"

    authenticator.verifyToken(formattedKey, formattedToken).then(function (result) {
      // { delta: 0 }
    });

    authenticator.verifyToken(formattedKey, '000 000').then(function (result) {
      // null
    });
  });
});
```

### Browsers that support WebCrypto

In total there are only a few hundred lines of uncompressed code here.

Each file is very small.

```
<script src="bower_components/unibabel/index.js"></script>
<script src="bower_components/unibabel/unibabel.hex.js"></script>
<script src="bower_components/unibabel/unibabel.base32.js"></script>

<script src="bower_components/botp/sha1-hmac.js"></script>
<script src="bower_components/botp/index.js"></script>

<script src="bower_components/authenticator/authenticator.js"></script>
```

### Browsers that do not support WebCrypto

```
<!-- forge.hmac -->
<script src="bower_components/forge/js/util.js"></script>
<script src="bower_components/forge/js/sha1.js"></script>
<script src="bower_components/forge/js/hmac.js"></script>

<!-- forge.random.getBytes -->
<script src="bower_components/forge/js/sha256.js"></script>
<script src="bower_components/forge/js/cipher.js"></script>
<script src="bower_components/forge/js/cipherModes.js"></script>
<script src="bower_components/forge/js/aes.js"></script>
<script src="bower_components/forge/js/prng.js"></script>
<script src="bower_components/forge/js/random.js"></script>
```

TODO: I'd love some help pruning the important bits out of the forge code.
Just using an alternate CPRNG would be very helpful in trimming the fat.

## API

### generateKey()

generates a 32-character (160-bit) base32 key

### generateToken(formattedKey)

generates a 6-digit (20-bit) decimal time-based token

### verifyToken(formattedKey, formattedToken)

validates a time-based token within a +/- 30 second (90 seconds) window

returns `null` on failure or an object such as `{ delta: 0 }` on success

QR Code
-------

See <https://davidshimjs.github.io/qrcodejs/> and <https://github.com/soldair/node-qrcode>.

![](http://cdn9.howtogeek.com/wp-content/uploads/2014/10/sshot-7-22.png)

Example use with `qrcode.js` in the browser:

```javascript
'use strict';

var el = document.querySelector('.js-qrcode-canvas');
var link = "otpauth://totp/{{NAME}}?secret={{KEY}}";
var name = "Your Service";
                                              // remove spaces, hyphens, equals, whatever
var key = "acqo ua72 d3yf a4e5 uorx ztkh j2xl 3wiz".replace(/\W/g, '').toLowerCase();

var qr = new QRCode(el, {
  text: link.replace(/{{NAME}}/g, name).replace(/{{KEY}}/g, key)
});
```

Formatting
----------

All non-alphanumeric characters are ignored, so you could just as well use hyphens
or periods or whatever suites your use case.

These are just as valid:

* "acqo ua72 d3yf a4e5 - uorx ztkh j2xl 3wiz"
* "98.24.63"

0, 1, 8, and 9 also not used (so that base32).
To further avoid confusion with O, o, L, l, I, B, and g
you may wish to display lowercase instead of uppercase.

TODO: should this library replace 0 with o, 1 with l (or I?), 8 with b, 9 with g, and so on?

90-second Window
----------------

The window is set to +/- 1, meaning each token is valid for a total of 90 seconds
(-30 seconds, +0 seconds, and +30 seconds)
to account for time drift (which should be very rare for mobile devices)
and humans who are handicapped or otherwise struggle with quick fine motor skills (like my grandma).
