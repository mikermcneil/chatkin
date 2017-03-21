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


  'GET /': { view: 'homepage' },
  'GET /login': { view: 'login' },
  'PUT /login': { action: 'login' },
  'PUT /user/:username/zone': { action: 'arrive' },
  'PUT /user/:username/remark': { action: 'make-remark' },

};
