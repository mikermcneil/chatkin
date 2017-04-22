/**
 * Custom configuration
 * (sails.config.custom)
 *
 * One-off settings specific to your application.
 *
 * For more information on custom configuration, visit:
 * http://sailsjs.com/config/custom
*/

module.exports.custom = {

  /**************************************************************************
  *                                                                          *
  * Default settings for custom configuration.                               *
  * (in production, some of these should be overridden in                    *
  * config/env/production.js.  To avoid checking in development credentials, *
  * consider setting some of these in `config/local.js`.)                    *
  *                                                                          *
  ***************************************************************************/
  numZonesPerDegreeSquare: 1,
  openWeatherApiKey: undefined,// TODO: include your openweather api key (or do it in local.js)
  twitterConsumerKey: undefined,// TODO: include your twitter app's consumer key (or do it in local.js)
  twitterConsumerSecret: undefined,// TODO: include your twitter app's consumer secret (or do it in local.js)

};
