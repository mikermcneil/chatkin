/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');
var flaverr = require('flaverr');


/**
 * lifejacket hook
 *
 * @description :: A hook definition.  Extends Sails by adding shadow routes, implicit actions, and/or initialization logic.
 * @docs        :: http://sailsjs.com/docs/concepts/extending-sails/hooks
 */

module.exports = function defineLifejacketHook(sails) {

  return {


    defaults: {

      lifejacket: {

        // Disabled by default. (e.g. for local dev)
        ensureHttps: false,

        // Must be set manually if `ensureHttps` is enabled.
        // > Should be provided as a string, like `foo.example.com`.
        host: undefined

      }

    },


    configure: function (){

      // If `ensureHttps` config was provided...
      if (!_.isUndefined(sails.config.lifejacket.ensureHttps)) {

        // Validate it.
        if (!_.isBoolean(sails.config.lifejacket.ensureHttps)) {
          throw flaverr({ name: 'ConfigurationError' }, new Error('If provided, `sails.config.lifejacket.ensureHttps` must be set to either `true` or `false`.  But instead got: '+util.inspect(sails.config.lifejacket.ensureHttps, {depth:null})));
        }

      }//>-•


      // If `host` config was provided...
      if (!_.isUndefined(sails.config.lifejacket.host)) {

        // Validate it.
        if (!_.isString(sails.config.lifejacket.host)) {
          throw flaverr({ name: 'ConfigurationError' }, new Error('`sails.config.lifejacket.host` must be configured as a string (like `foo.example.com`).  But instead got: '+util.inspect(sails.config.lifejacket.host, {depth:null})));
        }

        // Coerce it.
        sails.config.lifejacket.host = _.trimRight(sails.config.lifejacket.host, '/');
        sails.config.lifejacket.host = sails.config.lifejacket.host.replace(/^https?:\/\//, '');

      }
      // Otherwise, if it wasn't provided, make sure that's actually OK.
      // (if ensureHttps is enabled, then it is required)
      else {

        if (sails.config.lifejacket.ensureHttps) {
          throw flaverr({ name: 'ConfigurationError' }, new Error('Since `sails.config.lifejacket.ensureHttps` is enabled, a valid `sails.config.lifejacket.host` must be configured as a string (like `foo.example.com`).  But instead got: '+util.inspect(sails.config.lifejacket.host, {depth:null})));
        }

      }//>-•

    },


    /**
     * Runs when a Sails app loads/lifts.
     *
     * @param {Function} done
     */
    initialize: function (done) {

      sails.log.debug(
        'Initializing `lifejacket` hook...  '+
        (sails.config.lifejacket.ensureHttps ? '(https auto-redirects are ENABLED!)' : '(but https auto-redirects are disabled)')
      );

      // If this is production, but `lifejacket.ensureHttps` is NOT enabled, then
      // log a little warning message to the console.
      if (!sails.config.lifejacket.ensureHttps && process.env.NODE_ENV === 'production') {
        sails.log.warn('Detected production environment, but "https://" auto-redirects are disabled!');
        sails.log.warn('(Set `sails.config.lifejacket.ensureHttps` to `true` to turn them on again.)');
        sails.log.warn();
      }//-•

      // Be sure and call `done()` when finished!
      // (Pass in Error as the first argument if something goes wrong to cause Sails
      //  to stop loading other hooks and give up.)
      return done();

    },


    routes: {
      before: {
        'all /*': function (req, res, next) {

          // console.log('x-forwarded-proto:', req.get('x-forwarded-proto'));
          // console.log('sails.config.lifejacket.ensureHttps:', req.get('sails.config.lifejacket.ensureHttps'));

          // If the `lifejacket.ensureHttps` setting is disabled, then anything goes.
          if (!sails.config.lifejacket.ensureHttps) {
            return next();
          }//-•

          // If is a virtual request from a socket, then anything goes.
          if (req.isSocket) {
            return next();
          }//-•

          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          // But otherwise, this is an HTTP request of some kind, and we must be
          // interested in redirecting it, since we're configured to do so.
          //
          // Therefore, we'll check this request and see if it was originally sent
          // via the `http://` protocol.  If so, we'll redirect it to `https://`.
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


          // If this is https://, then we're good.
          // (we'll go ahead and allow the request through)
          if (req.get('x-forwarded-proto') === 'https') {
            return next();
          }//-•

          // Otherwise, this is an insecure request to `http://`.
          // So redirect it to its `https://` cousin.
          return res.redirect(301, 'https://'+sails.config.lifejacket.host+req.url);

        }//</ all /* >
      }//</.before>
    }//</.routes>

  };

};
