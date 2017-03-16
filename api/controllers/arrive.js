module.exports = {


  friendlyName: 'Arrive',


  description: 'Arrive somewhere.',


  inputs: {
    username: { type: 'string', required: true },
    lat: { type: 'number', required: true },
    long: { type: 'number', required: true },
  },


  exits: {
    userNotFound: { description: 'No such user.', statusCode: 400 }
  },


  fn: function (inputs, exits, env) {

    // latitude, longitude
    // - - - - - - - - - - - - - - - - - - - -
    // (85, -180) // top left corner of map
    // (-85, 180) // bottom right corner of map
    var xDegrees = inputs.long + 180;
    var yDegrees = (inputs.lat*(-1)) + 85;

    // Visualization:
    // - - - - - - - - - - - - - - - - - - - -
    //     0                  360
    //      __________________
    //   0 |..                |
    //     |..                |
    //     |   etc            |
    //     |                  |
    //     |                  |
    // 170 |__________________|

    // Without specifiying `numZonesPerDegreeSquare`, it defaults
    // to one -- meaning we would get one zone for every 1° longitude,
    // 1° latitude square (61,200 zones in total.)
    // But the `numZonesPerDegreeSquare` setting allows us to further
    // divide up these zones into even more, smaller sub-zones.
    //
    // > To get neighborhoods/street-granular zones, you might
    // > use a `numZonesPerDegreeSquare` of 1000.  For less granular
    // > zones, you could use a lower number.
    // >
    // > For a more precise sense of scale, see the table here:
    // > https://en.wikipedia.org/wiki/Decimal_degrees#Precision
    var x = Math.floor(xDegrees * sails.config.custom.numZonesPerDegreeSquare);
    var y = Math.floor(yDegrees * sails.config.custom.numZonesPerDegreeSquare);

    User.findOne({ username: inputs.username }).exec(function(err, thisUser){
      if (err) { return exits.error(err); }
      if (!thisUser) { return exits.userNotFound(); }

      if (thisUser.currentZone) {
        Zone.unsubscribe(env.req, [thisUser.currentZone]);
      }

      Zone.findOne({ x: x, y: y }).exec(function(err, zone) {
        if (err) { return exits.error(err); }
        if (!zone) { return exits.error(new Error('Consistency violation: Expected Zone record to exist for coordinate ('+x+','+y+'), but it did not.  Are you sure the database is seeded with data?')); }

        User.update()
        .where({ username: inputs.username })
        .set({ currentZone: zone.id })
        .exec(function (err) {
          if (err) { return exits.error(err); }

          sails.log('@'+inputs.username+' arrived in zone with coordinates: ( %d, %d )', x, y);

          // Subscribe to socket (RPS) notifications about this zone.
          Zone.subscribe(env.req, [zone.id]);

          // Publish this user's arrival to the new zone.
          Zone.publish([zone.id], {
            verb: 'userArrived',
            username: inputs.username,
            remark: thisUser.remark
          }, env.req);

          return exits.success();
        });
      });
    });

  }


};
