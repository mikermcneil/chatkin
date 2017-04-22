/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.com/config/bootstrap
 */

module.exports.bootstrap = function(cb) {

  if(process.version.match(/^v0\./)) {
    return cb(new Error('This example app should be run with node version 4.x or above. (You are using '+process.version+')'));
  }

  sails.config.custom = sails.config.custom || {};

  // Check mandatory config & warn about it if necessary.
  var isMissingMandatoryCustomConfig;
  if (_.isUndefined(sails.config.custom.openWeatherApiKey)) {
    sails.log.warn('No `sails.config.custom.openWeatherApiKey` was configured.');
    isMissingMandatoryCustomConfig = true;
  }
  if (_.isUndefined(sails.config.custom.twitterConsumerSecret)) {
    sails.log.warn('No `sails.config.custom.twitterConsumerSecret` was configured.');
    isMissingMandatoryCustomConfig = true;
  }
  if (_.isUndefined(sails.config.custom.twitterConsumerKey)) {
    sails.log.warn('No `sails.config.custom.twitterConsumerKey` was configured.');
    isMissingMandatoryCustomConfig = true;
  }//>-


  if (isMissingMandatoryCustomConfig) {
    sails.log.warn('(Until this is resolved, some aspects of Chatkin will not work properly!)');
    sails.log.warn();
    sails.log.warn('> Tip: In development, use `config/locals.js`.  For production, use environment variables.');
    sails.log.warn('> Or, if you want to check them in to source control, use:');
    sails.log.warn('> • config/custom.js  (for development)');
    sails.log.warn('> • config/env/production.js  (for production)');
    sails.log.warn('>');
    sails.log.warn('> (See https://sailsjs.com/docs/concepts/configuration for more help configuring Sails.)');
    sails.log.warn();
  }


  // Apply defaults for optional config.
  sails.config.custom.numZonesPerDegreeSquare = sails.config.custom.numZonesPerDegreeSquare || 1;
  sails.config.custom.numZonesPerDegreeSquare = Math.floor(sails.config.custom.numZonesPerDegreeSquare);

  // Quick forward about zone dimensions:
  // ----------------------------------------------------------------
  // • 1° of latitude is between 110.567km and 111.699km tall
  //   (thus approximately 111km for our fuzzy purposes.)
  //
  // • A degree of longitude is widest at the equator (also ~111km) and gradually shrinks
  //   to zero at the poles.  More formally, the width of 1° of longitude depends on the
  //   latitude as given by the formula `|cos(lat)| * ARPX_LAT_WIDTH_IN_KM`, where `lat`
  //   is the latitude in decimal degrees (see https://en.wikipedia.org/wiki/Decimal_degrees)
  //   and APRX_LAT_WIDTH_IN_KM is the width in km of 1° of latitude at the point of
  //   measurement-- which for our fuzzy purposes here can always be simply rounded to 111km.
  //
  //
  // e.g. for a zone in Austin, TX located at approximately
  // lat: 30.28 / longitude: -97.71
  //
  // ...we can compute the width and height of a default 1° sq zone
  // as follows:
  //
  // > Original formula:
  // > lon = |cos(lat)| * APRX_LAT_WIDTH_IN_KM
  //
  // ```
  // Math.abs(Math.cos(30.28)) * 111
  // // => 46.76344697164029 kilometers
  // ```
  //
  // --
  // Most of the time, apps like this could get away with using fuzzy zone
  // boundaries, and simply compute a relevancy radius using something really
  // simple and naive-- e.g. dividing its approximate latitudinal height (111)
  // by two.  If we cared more about accuracy, we might consider computing either
  // the shortest or longest hypotenuse from the particular lat/long coordinates
  // within the zone out to each of its four corners.  For a conservative radius,
  // we could use the shortest, or for a more liberal, the longest.
  //
  // But for an even more accurate picture, we need to not only use the relevancy
  // radius, but also adjust the lat/long of the center point where the radius applies--
  // i.e. to the lat/long coordinates at the center of the rectangular zone. Even then,
  // since zones are rectangles and not circles, a radius will never be _exactly_ right
  // (esp. since the actual km dimensions of zones are uneven rectangles, where an
  // ellipse would be at least closer to the truth).  Nonetheless, normalizing the
  // coordinates goes a long way towards improving accuracy in situations where you
  // have little other choice but to cast a circular net (e.g. the Twitter search API).
  // ----------------------------------------------------------------


  // Now we'll build our coordinate system.
  var xMax = Math.floor(360 * sails.config.custom.numZonesPerDegreeSquare);
  var yMax = Math.floor(180 * sails.config.custom.numZonesPerDegreeSquare);
  // - - - - - - - - - - - - - - - - - - - -
  //     0                  xMAX
  //       __________________
  //   0  |..                |
  //      |..                |
  //      |   etc            |
  //      |                  |
  //      |                  |
  // yMax |__________________|
  //
  //
  // > See `controllers/arrive.js` for more info.
  // - - - - - - - - - - - - - - - - - - - -


  Zone.count().exec(function(err, numZones) {
    if (err) { return cb(err); }

    if (numZones > xMax*yMax) {
      return cb(new Error('Consistency violation: More zones ('+numZones+') than expected!'));
    }

    if (numZones === xMax*yMax) {
      sails.log('Using existing zones and users.');

      // Since the users must already exist, clear their zones just in case the server crashed.
      User.update({ currentZone: {'!=':null} })
      .set({ currentZone: null })
      .exec(function(err) {
        if(err) { return cb(err); }
        return cb();
      });//_∏_
      return;
    }//-•

    // Build a representation of all 60,000 or so zones.
    sails.log('Building %d zones...', xMax*yMax);
    var zones = [];
    for (var x=0; x<xMax; x++) {
      for (var y=0; y<yMax; y++) {
        zones.push({ x: x, y: y });
      }
    }

    // Save new zones to the database.
    sails.log('Persisting %d zones...', xMax*yMax);
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // Note: PostgreSQL only allows up to ~15,000 records to be created in a single createEach.
    // > If you need to work around that, file an issue in `pg`, import the initial data manually,
    // > or write up a workaround that splits this up into separate queries instead of one.
    // > (For help, visit https://sailsjs.com/support)
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    Zone.createEach(zones).exec(function(err) {
      if (err) { return cb(err); }
      return cb();
    });
  });

};
