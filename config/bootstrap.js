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

  sails.config.custom = sails.config.custom || {};
  sails.config.custom.numZonesPerDegreeSquare = sails.config.custom.numZonesPerDegreeSquare || 1;
  sails.config.custom.numZonesPerDegreeSquare = Math.floor(sails.config.custom.numZonesPerDegreeSquare);

  var xMax = Math.floor(360 * sails.config.custom.numZonesPerDegreeSquare);
  var yMax = Math.floor(170 * sails.config.custom.numZonesPerDegreeSquare);
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
      return cb(new Error('Consistency violation: More zones than expected!'));
    }

    if (numZones === xMax*yMax) {
      sails.log('Using existing zones and users.');
      return cb();
    }

    // Create a few users.
    User.createEach([
      { username: 'rachaelshaw' },
      { username: 'irlnathan' },
      { username: 'particlebanana' },
      { username: 'sgress454' },
      { username: 'mikermcneil' }
    ]).exec(function(err) {
      if (err) { return cb(err); }

      // Build a representation of all 61,200 zones.
      sails.log('Building %d zones...', xMax*yMax);
      var zones = [];
      for (var x=0; x<xMax; x++) {
        for (var y=0; y<yMax; y++) {
          zones.push({ x: x, y: y });
        }
      }

      // Save new zones to the database.
      sails.log('Persisting %d zones...', xMax*yMax);
      Zone.createEach(zones).exec(function(err) {
        if (err) { return cb(err); }
        return cb();
      });
    });
  });

};
