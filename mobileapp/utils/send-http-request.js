/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');
var flaverr = require('./flaverr');


/**
 * Module constants
 */

var DEFAULT_API_SERVER_BASE_URL = 'http://localhost:1337';




/**
 * sendHttpRequest()
 *
 * @required {String} url
 * @required {String} method
 *
 * @optional {String} baseUrl
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

module.exports = function sendHttpRequest(options, done){

  if (_.isUndefined(options)) {
    options = {};
  }

  if (!_.isFunction(done)) { throw new Error('Valid node-style callback function must be provided as the 2nd argument!'); }


  (function (proceed){

    if (!_.isObject(options)) { return proceed(new Error('`options` dictionary should be provided as the 1st argument!')); }


    if (_.isUndefined(options.baseUrl)) {
      options.baseUrl = DEFAULT_API_SERVER_BASE_URL;
    }
    if (_.isUndefined(options.headers)) {
      options.headers = {};
    }

    if (_.isUndefined(options.url)) { return proceed(new Error('`url` is required')); }
    if (_.isUndefined(options.method)) { return proceed(new Error('`method` is required')); }

    // Prepare body (if relevant)
    //  • if no body, this is just `undefined`
    //  • if body is string primitive, it does not get double-wrapped (e.g. 'foo' stays 'foo', not '"foo"')
    var serializedBodyMaybe;
    var didJSONStringify;
    if (_.isUndefined(options.body)) {
      serializedBodyMaybe = undefined;
      didJSONStringify = false;
    }
    else if (_.isString(options.body)) {
      serializedBodyMaybe = options.body;
      didJSONStringify = false;
    }
    else {
      serializedBodyMaybe = JSON.stringify(options.body);
      didJSONStringify = true;
    }

    // Add JSON content-type header if the body was stringified.
    if (didJSONStringify) {
      options.headers['Content-Type'] = 'application/json';
    }

    fetch(options.baseUrl + options.url, {
      method: options.method,
      headers: options.headers,
      body: serializedBodyMaybe
    })
    .then(function (res) {

      res.text()
      .then(function (plainText) {

        var resInfo = {
          statusCode: +res.status,
          headers: res.headers,
          body: plainText
        };

        // We'll treat a non-2xx status code as an error, but we'll
        // give it a special error code so it's easily digested by
        // our friends up in userland.
        if(resInfo.statusCode >= 300 || resInfo.statusCode < 200) {
          return proceed(flaverr({
            code: 'E_NON_200_RESPONSE',
            body: resInfo.body,
            statusCode: resInfo.statusCode,
            headers: resInfo.headers,
          }, new Error(
            'Server responded with '+resInfo.statusCode+(_.isUndefined(resInfo.body) ? '.' : ': '+resInfo.body)
          )));
        }//-•

        // Otherwise we'll consider it a success.

        // If there was no body, we're proceed.
        if (_.isUndefined(resInfo.body)) {
          return proceed(undefined, resInfo);
        }//-•


        // But otherwise, we'll attempt to parse the raw response body as JSON.

        if (!_.isString(resInfo.body)) { return proceed(new Error('Consistency violation: Something fishy is going on.  If present, the raw response body should be a string at this point. But instead got: '+resInfo.body)); }

        var parsedResponseBody;
        try {
          parsedResponseBody = JSON.parse(resInfo.body);
        } catch (e) {
          // Note that this approach CAN NEVER correctly understand the situation where the server
          // sends back a string like `"foo"` in plain text.  It will always think it is `foo`, because
          // it will successfully JSON parse it.  Fortunately, this case almost never comes up.
          parsedResponseBody = resInfo.body;
        }

        resInfo.data = parsedResponseBody;

        return proceed(undefined, resInfo);

      }).catch(proceed);//</ .text() >

    })//</ fetch()...then() >
    .catch(function(err){

      // Negotiate network / "request failed" error:
      var isRequestFailedError = (err.name === 'TypeError');
      // ```
      // > "A fetch() promise rejects with a TypeError when a network error is encountered"
      // > (https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch)
      // ```

      if (!isRequestFailedError) { return proceed(err); }
      else {
        return proceed(flaverr({code: 'E_OFFLINE'}, new Error(
          'Cannot communicate with server.  Are you sure you\'re connected to the internet?  '+
          'If you\'re sure you are, then there is probably a proxy issue, or our server is down.'
        )));
      }
    });//</ fetch()...catch() >

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
