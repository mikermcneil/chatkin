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

  var XMAX = 360;
  var YMAX = 170;

  // - - - - - - - - - - - - - - - - - - - -
  //     0                  360
  //      __________________
  //   0 |..                |
  //     |..                |
  //     |   etc            |
  //     |                  |
  //     |                  |
  // 170 |__________________|
  // - - - - - - - - - - - - - - - - - - - -



  Zone.count().exec(function(err, numZones) {
    if (err) { return cb(err); }

    if (numZones > XMAX*YMAX) {
      return cb(new Error('Consistency violation: More zones than expected!'));
    }

    if (numZones === XMAX*YMAX) {
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
      sails.log('Building %d zones...', XMAX*YMAX);
      var zones = [];
      for (var x=0; x<XMAX; x++) {
        for (var y=0; y<YMAX; y++) {
          zones.push({ x: x, y: y });
        }
      }

      // Save new zones to the database.
      sails.log('Persisting %d zones...', XMAX*YMAX);
      Zone.createEach(zones).exec(function(err) {
        if (err) { return cb(err); }
        return cb();
      });
    });
  });

};
