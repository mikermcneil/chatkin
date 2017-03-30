module.exports = {


  friendlyName: 'Arrive',


  description: 'Arrive somewhere.',


  inputs: {
    lat: { type: 'number', required: true },
    long: { type: 'number', required: true },
  },


  exits: {
    success: { description: 'It worked.', outputFriendlyName: 'Zone info' },
    notLoggedIn: {
      statusCode: 401,
      description: 'Requesting user was not authenticated.',
      extendedDescription: 'You must be logged in to be allowed to arrive in a zone.'
    }
  },


  fn: function (inputs, exits, env) {

    var Twitter = require('machinepack-twitter');
    var OpenWeather = require('machinepack-openweather');

    // Get access to request instance.
    // (We'll use this for accessing the session and subscribing/publishing around the socket.)
    var req = env.req;

    if (!req.isSocket) {
      return exits.error(new Error('This is not a socket request.  (In order to arrive in a zone, you must use VR over socket.io -- i.e. `io.socket`)'));
    }

    // Check if the requesting user is logged in.
    // If not, then bail.
    if (!req.session.userId) {
      return exits.notLoggedIn();
    }// --•



    // latitude, longitude
    // - - - - - - - - - - - - - - - - - - - -
    // (90, -180) // top left corner of map
    // (-90, 180) // bottom right corner of map
    var xDegrees = inputs.long + 180;
    var yDegrees = (inputs.lat*(-1)) + 90;

    // Visualization:
    // - - - - - - - - - - - - - - - - - - - -
    //     0                  360
    //      __________________
    //   0 |..                |
    //     |..                |
    //     |   etc            |
    //     |                  |
    //     |                  |
    // 180 |__________________|

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

    User.findOne({ id: req.session.userId }).exec(function(err, thisUser){
      if (err) { return exits.error(err); }
      if (!thisUser) { return exits.error(new Error('The requesting user is logged in as user `'+req.session.userId+'`, but no such user exists in the database.  This should never happen!')); }

      if (thisUser.currentZone) {
        Zone.unsubscribe(req, [thisUser.currentZone]);
      }

      Zone.findOne({ x: x, y: y }).exec(function(err, zone) {
        if (err) { return exits.error(err); }
        if (!zone) { return exits.error(new Error('Consistency violation: Expected Zone record to exist for coordinate ('+x+','+y+'), but it did not.  Are you sure the database is seeded with data?')); }


        (function cacheWeatherMaybe(proceed){

          // Use cached weather, if possible -- as long as it's not too old.
          var rightNow = Date.now();
          var fourHoursAgo = rightNow - (1000*60*60*4);
          var notTooStale = fourHoursAgo < zone.lastCachedWeatherAt;
          if (notTooStale)  {
            return proceed();
          }

          OpenWeather.getCurrentConditions({
            apiKey: sails.config.custom.openWeatherApiKey,
            latitude: inputs.lat,
            longitude: inputs.long,
          }).exec(function(err, weather) {
            if (err) { return proceed(err); }

            // Cache weather
            Zone.update({ id: zone.id })
            .set({ cachedWeather: weather, lastCachedWeatherAt: rightNow })
            .exec(function(err) {
              if (err) { return proceed(err); }

              // Stick the newly-fetched weather on our zone record
              // so we have it in the same format as if it was already
              // cached beforehand; just in case we want it that way
              // below.  (Makes it easier to think about.)
              zone.cachedWeather = weather;

              return proceed();
            });
          });

        })(function afterCachingWeather(err){
          if (err) { return exits.error(err); }

          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          // FUTURE: To improve zone load time (esp. for the first load of the day for that zone),
          // use `async.auto` to fetch the weather and search tweets simultaneously.
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          (function cacheTweetsMaybe(proceed){

            // Use cached tweets, if possible -- as long as they're not too old.
            var rightNow = Date.now();
            var twoHoursAgo = rightNow - (1000*60*60*2);
            var notTooStale = twoHoursAgo < zone.lastCachedTweetsAt;
            if (notTooStale)  {
              return proceed();
            }

            // FUTURE: Probably temporarily cache the bearer token, rather than looking it up every time.
            // (But note that it expires)
            Twitter.getBearerToken({
              consumerKey: sails.config.custom.twitterConsumerKey,
              consumerSecret: sails.config.custom.twitterConsumerSecret,
            }).exec(function(err, bearerToken) {
              if (err) { return proceed(err); }

              // Compute relevancy radius and adjusted lat/long:
              // > For more about what this is and why we have to compute
              // > it this way, see config/bootstrap.js.
              var zoneCenterLatitudeDeg;
              var zoneCenterLongitudeDeg;
              var relevancyRadius;
              try {
                zoneCenterLatitudeDeg = (function(){
                  var zoneTopLatitudeDeg = inputs.lat;
                  var ZONE_HEIGHT_IN_DEG = (1 / sails.config.custom.numZonesPerDegreeSquare);
                  return zoneTopLatitudeDeg + (ZONE_HEIGHT_IN_DEG/2);
                })();
                zoneCenterLongitudeDeg = (function(){
                  var zoneLeftLongitudeDeg = inputs.long;
                  var ZONE_WIDTH_IN_DEG = (1 / sails.config.custom.numZonesPerDegreeSquare);
                  return zoneLeftLongitudeDeg + (ZONE_WIDTH_IN_DEG/2);
                })();
                relevancyRadius = (function(){
                  var zoneHeightKm;
                  var zoneWidthKm;
                  var zoneEdgeHypotenuse;
                  //todo

                  //- - - - - - - - - - - - - - - - - - - - - - - - - - -
                  return 5;
                  //^^^^
                  //TODO: do the real calculations as hinted at above
                  //instead of this stuff
                  //- - - - - - - - - - - - - - - - - - - - - - - - - - -
                })();
              } catch (e) { return proceed(e); }

              // console.log('Searching for tweets around ('+inputs.lat+'° N,'+inputs.long+'°)');
              Twitter.searchTweets({
                bearerToken: bearerToken,
                latitude: zoneCenterLatitudeDeg,
                longitude: zoneCenterLongitudeDeg,
                radius: relevancyRadius
              }).exec(function(err, matchingTweets){
                if (err) { return proceed(err); }

                // console.log('For zone #'+zone.id+'...');
                // console.log('%d matching tweets:', matchingTweets.length, matchingTweets);

                // Cache tweets
                Zone.update({ id: zone.id })
                .set({ cachedTweets: matchingTweets, lastCachedTweetsAt: rightNow })
                .exec(function(err) {
                  if (err) { return proceed(err); }

                  // Stick the newly-fetched tweets on our zone record
                  // so we have it in the same format as if it was already
                  // cached beforehand; just in case we want it that way
                  // below.  (Makes it easier to think about.)
                  zone.cachedTweets = matchingTweets;

                  return proceed();
                });
              });
            });

          })(function afterCachingTweets(err){
            if (err) { return exits.error(err); }

            User.update()
            .where({ username: thisUser.username })
            .set({ currentZone: zone.id })
            .exec(function (err) {
              if (err) { return exits.error(err); }

              sails.log('@'+thisUser.username+' arrived in zone with coordinates: ( %d, %d )', x, y);

              // Subscribe to socket (RPS) notifications about this zone.
              Zone.subscribe(req, [zone.id]);

              // Publish this user's arrival to the new zone.
              Zone.publish([zone.id], {
                verb: 'userArrived',
                username: thisUser.username,
                remark: thisUser.remark,
                avatarColor: thisUser.avatarColor
              }, req);

              // Look up any other people who are in here already.
              User.find({ currentZone: zone.id }).exec(function (err, usersHere){
                if (err) { return exits.error(err); }

                var otherUsersHere = _.without(usersHere, { id: thisUser.id });


                return exits.success({
                  id: zone.id,
                  numOtherUsersHere: otherUsersHere.length,
                  otherUsersHere: otherUsersHere,
                  weather: zone.cachedWeather,
                });

              });

            });
          });//</ cacheTweetsMaybe  (self-calling function) >
        });//</ cacheWeatherMaybe  (self-calling function) >
      });
    });

  }


};
