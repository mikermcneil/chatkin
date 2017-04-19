/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * http://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {


  'GET /': { action: 'view-homepage' },
  'GET /login': { view: 'login' },
  'GET /signup': { view: 'signup' },
  'PUT /login': { action: 'login' },
  'PUT /signup': { action: 'signup' },
  'PUT /logout': { action: 'logout' },
  'PUT /user/:username/zone': { action: 'arrive' },
  // Since the 'arrive' action doesn't actually need a username anymore,
  // we can use it without including that parameter.
  // (TODO: probably don't duplicate it like this, but I don't want to break the web app
  // right now so am leaving both.)
  'PUT /arrive': { action: 'arrive' },
  'PUT /user/:username/remark': { action: 'make-remark' },
  'GET /test': { action: 'test' },
};
