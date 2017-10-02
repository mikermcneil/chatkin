/**
 * Module dependencies
 */

var stdlib = require('sails-stdlib');


/**
 * stdlib hook
 *
 * @description :: A hook definition.  Extends Sails by adding shadow routes, implicit actions, and/or initialization logic.
 * @docs        :: https://sailsjs.com/docs/concepts/extending-sails/hooks
 */

module.exports = function defineStdlibHook(sails) {

  return {

    /**
     * Runs when a Sails app loads/lifts.
     *
     * @param {Function} done
     */
    initialize: function (done) {

      sails.log.debug('Initializing custom hook (`stdlib`).  All this does is make it so you can use `sails.stdlib(\'foo\')`');

      // Expose sails-stdlib as `sails.stdlib()`.
      sails.stdlib = stdlib;

      return done();

    }

  };

};
