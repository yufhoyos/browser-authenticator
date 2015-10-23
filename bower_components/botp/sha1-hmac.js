(function (exports) {
'use strict';

exports.sha1Hmac = function (key, bytes) {
  if (!window.Unibabel) {
    throw new Error("Unibabel.js is required to convert between buffers and binary strings");
  }

  if ('string' === typeof key) {
    throw new Error("use one of Unibabel.utf8ToBuffer(key), Unibabel.base64ToBuffer(key), or Unibabel.hexToBuffer(key) before passing to sha1Hmac(key, bytes)");
  }

  var Unibabel = window.Unibabel;

  function useForge() {
    var forge = window.forge;
    var hmac = forge.hmac.create();
    var digest;
    hmac.start('sha1', Unibabel.bufferToBinaryString(key));
    hmac.update(Unibabel.bufferToBinaryString(bytes));
    digest = hmac.digest().toHex();

    return window.Promise.resolve(digest);
  }

  function useWebCrypto() {
    return (window.crypto.subtle||window.crypto.webkitSubtle).importKey(
      "raw"
    , key
    , {  name: "HMAC"
      , hash: { name: "SHA-1" }
      }
    , false
    , ["sign", "verify"]
    )
    /*
    return crypto.subtle.importKey(
      "jwk", //can be "jwk" or "raw"
      {   //this is an example jwk key, "raw" would be an ArrayBuffer
          kty: "oct",
          k: "Y0zt37HgOx-BY7SQjYVmrqhPkO44Ii2Jcb9yydUDPfE",
          alg: "HS256",
          ext: true,
      },
      {   //this is the algorithm options
          name: "HMAC",
          hash: {name: "SHA-256"}, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
          //length: 256, //optional, if you want your key length to differ from the hash function's block length
      },
      false, //whether the key is extractable (i.e. can be used in exportKey)
      ["sign", "verify"] //can be any combination of "sign" and "verify"
    )
    */
    .then(function (cryptoKey) {
      return (window.crypto.subtle||window.crypto.webkitSubtle).sign(
        { name: "HMAC" }
      , cryptoKey  // from generateKey or importKey above
      , new Uint8Array(bytes) // ArrayBuffer of data you want to sign
      )
      .then(function(signature){
        // returns an ArrayBuffer containing the signature
        return Unibabel.bufferToHex(new Uint8Array(signature));
      });
    });
  }

  if (window.crypto) {
    // WebCrypto is so unreliable right now... ugh...
    try {
      return useWebCrypto().then(function (result) {
        return result;
      }, function (err) {
        console.warn(err);
        console.warn(err.stack);
        console.warn("WebCrypto failed, trying forge.js");

        return useForge();
      });
    } catch(e) {
      console.warn(e);
      console.warn(e.stack);
      console.warn("WebCrypto threw exception, trying forge.js");

      return useForge();
    }
  }
  else if (window.forge) {
    return useForge();
  }
  else {
    throw new Error("WebCrypto or forge.js is required to create a sha1 hmac");
  }
};

}(
  'undefined' !== typeof window ? window : module.exports
, 'undefined' !== typeof process ? process.env.NODE_ENV : false
));
