/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');
var flaverr = require('./flaverr');




/**
 * sendSocketRequest()
 *
 * @required {String} url
 * @required {String} method
 *
 * @optional {Ref} body
 *
 * @callback {Function}
 *           @param {Error?}
 *           @param {Dictionary} resInfo
 *                  @property {String?} body
 *                  @property {JSON?} data
 *                  @property {Number} statusCode
 *                  @property {Dictionary} headers
 */

module.exports = function sendSocketRequest(options, done){

  if (_.isUndefined(options)) {
    options = {};
  }

  if (!_.isFunction(done)) { throw new Error('Valid node-style callback function must be provided as the 2nd argument!'); }


  (function (proceed){

    if (!_.isObject(options)) { return proceed(new Error('`options` dictionary should be provided as the 1st argument!')); }


    if (_.isUndefined(options.headers)) {
      options.headers = {};
    }

    if (_.isUndefined(options.url)) { return proceed(new Error('`url` is required')); }
    if (_.isUndefined(options.method)) { return proceed(new Error('`method` is required')); }

    if (!_.isUndefined(options.baseUrl)) {
      return proceed(new Error('`baseUrl` is not supported for socket requests.'));
    }


    // Grab socket
    if (typeof window.io === 'undefined') {
      return proceed(new Error('Could not access `io.socket`: `window.io` is undefined.'));
    }
    else if (typeof window.io !== 'function') {
      return proceed(new Error('Could not access `io.socket`: `window.io` is invalid:' + window.io));
    }
    else if (typeof window.io.socket === 'undefined') {
      return proceed(new Error('Could not access `io.socket`: `window.io` does not have a `socket` property.  Make sure `sails.io.js` is being loaded properly!'));
    }

    var socket = window.io.socket;

    // Determine if the socket has been disconnected, or if it
    // has NEVER BEEN connected and is not CURRENTLY TRYING to
    // connect.
    var disconnectedOrWasNeverConnectedAndUnlikelyToTry = (
      // =>
      // If the socket is connected, cool, no problem.
      !io.socket.isConnected() &&
      // =>
      // If the socket is at least _attempting_ to connect, we'll go ahead
      // and let it try to do it's thing (i.e. queue and replay)
      !io.socket.isConnecting() &&
      // =>
      // If the socket hasn't even had the _chance_ to begin connecting
      // (because the one-tick auto-connect timer hasn't fired yet),
      // then we'll give it that chance.
      !io.socket.mightBeAboutToAutoConnect()
    );



    // console.warn('io.socket.isConnected()',io.socket.isConnected());
    // console.warn('io.socket.isConnecting()',io.socket.isConnecting());
    // console.warn('io.socket._isConnecting',io.socket._isConnecting);
    // console.warn('io.socket.mightBeAboutToAutoConnect()',io.socket.mightBeAboutToAutoConnect());


    // If none of the above were true, then do a special error.
    if (disconnectedOrWasNeverConnectedAndUnlikelyToTry) {
      return proceed(flaverr({code: 'E_OFFLINE'}, new Error(
        'Cannot communicate with server.  Are you sure you\'re connected to the internet?  '+
        'If you\'re sure you are, then there is probably a proxy issue, or our server is down.'
      )));
    }

    // Otherwise the socket is either connected, in the process of connecting,
    // or in an indeterminate state where it has _never_ connected but _might_
    // still connect (see above for details).
    //
    // In any of these cases, thanks largely to queuing, it is safe to continue
    // onwards, and to send the request!
    // console.warn('CALLING io.socket.request()');
    // console.warn('io.sails is:',JSON.stringify(io.sails));
    io.socket.request({
      method: options.method,
      url: options.url,
      headers: options.headers,
      data: options.body
    }, function (unused, jwr) {
      // console.warn('CALLBACK FROM SOCKET REQUEST');

      // We'll treat a non-2xx status code as an error, but we'll
      // give it a special error code so it's easily digested by
      // our friends up in userland.
      if(jwr.statusCode >= 300 || jwr.statusCode < 200) {
        return proceed(flaverr({
          code: 'E_NON_200_RESPONSE',
          body: jwr.body,
          statusCode: jwr.statusCode,
          headers: {
            get: function(headerName){
              return jwr.headers[headerName.toLowerCase()];
            },
            // FUTURE: support rest of things, or better yet, just make the other sendHttpRequest() utility use a good old fashioned dictionary
          },
        }, new Error(
          'Server responded with '+jwr.statusCode+(_.isUndefined(jwr.body) ? '.' : ': '+jwr.body)
        )));
      }//-•

      return proceed(undefined, {
        data: jwr.body,
        body: jwr.body,
        statusCode: jwr.statusCode,
        headers: {
          get: function(headerName){
            return jwr.headers[headerName.toLowerCase()];
          },
          // FUTURE: support rest of things, or better yet, just make the other sendHttpRequest() utility use a good old fashioned dictionary
        }
      });
    });//</ io.socket.request() method >

  })(function (err, resInfo){

    try {
      return done(err, resInfo);
    } catch (e) {
      console.warn('Unhandled error was thrown in an asynchronous callback! (see error log)');
      console.error(e);
      return;
    }

  });//</ self-calling function >

};
