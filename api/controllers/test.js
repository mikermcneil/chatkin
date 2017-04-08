module.exports = {

  // TODO: get rid of this fake endpoint once done testing
  friendlyName: 'Arrive',


  description: 'Arrive somewhere.',


  inputs: {},


  exits: {
    success: { description: 'It worked.', outputFriendlyName: 'Zone info' },
  },


  fn: function (inputs, exits, env) {

    var Twitter = require('machinepack-twitter');
    var OpenWeather = require('machinepack-openweather');

    // Get access to request instance.
    // (We'll use this for accessing the session and subscribing/publishing around the socket.)
    var req = env.req;

    // if (!req.isSocket) {
    //   return exits.error(new Error('This is not a socket request.  (In order to arrive in a zone, you must use VR over socket.io -- i.e. `io.socket`)'));
    // }

    // // Check if the requesting user is logged in.
    // // If not, then bail.
    // if (!req.session.userId) {
    //   return exits.notLoggedIn();
    // }// --•



    // latitude, longitude
    // - - - - - - - - - - - - - - - - - - - -
    // (90, -180) // top left corner of map
    // (-90, 180) // bottom right corner of map
    var xDegrees = 97 + 180;
    var yDegrees = (30*(-1)) + 90;

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

    User.findOne({ username: 'rachael' }).exec(function(err, thisUser){
      if (err) { return exits.error(err); }
      // if (!thisUser) { return exits.error(new Error('The requesting user is logged in as user `'+req.session.userId+'`, but no such user exists in the database.  This should never happen!')); }

      // FAKE HACK: Make fake user:
      thisUser = { currentZone: null, username: 'rachael' };

      if (thisUser.currentZone) {
        // Unsubscribe this user from the old zone, and publish her departure
        // to update other clients' UIs.
        try {
          Zone.unsubscribe(req, [thisUser.currentZone]);

          Zone.publish([thisUser.currentZone], {
            verb: 'userLeft',
            username: thisUser.username
          }, req);

        } catch (e) { return exits.error(e); }
      }

      Zone.findOne({ x: x, y: y }).exec(function(err, zone) {
        if (err) {
          if (err.name === 'AdapterError') {
            return exits.error(new Error('Unexpeted adapter error!  Internal stack trace: '+err.raw.stack+'\n\nPrettified stack trace: '+err.stack));
          }
          else {
            return exits.error(err);
          }
        }
        if (!zone) { return exits.error(new Error('Consistency violation: Expected Zone record to exist for coordinate ('+x+','+y+'), but it did not.  Are you sure the database is seeded with data?')); }


        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        // Note: The kind of caching logic below (for weather and tweets) could be extrapolated
        // into a generic "fetchAndCache" helper.  For an example of that, check out this commit:
        // https://github.com/mikermcneil/inabottle/commit/9a38001583d00d8b50fb8938d8f5cbcf7b63da99
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

        (function cacheWeatherMaybe(proceed){

          try {
            // Use cached weather, if possible -- as long as it's not too old.
            var rightNow = Date.now();
            var fourHoursAgo = rightNow - (1000*60*60*4);
            var notTooStale = fourHoursAgo < zone.lastCachedWeatherAt;
            if (notTooStale)  {
              return proceed();
            }

            OpenWeather.getCurrentConditions({
              apiKey: sails.config.custom.openWeatherApiKey,
              latitude: 30,
              longitude: 97,
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

              }, proceed);//</ Zone.update().exec() >
            });//</ OpenWeather.getCurrentConditions() >
          } catch (e) { return proceed(e); }

        })(function afterCachingWeather(err){
          if (err) { return exits.error(err); }

          // Compute relevancy radius and adjusted lat/long:
          // > For more about what this is and why we have to compute
          // > it this way, see config/bootstrap.js.
          var zoneCenterLatitudeDeg;
          var zoneCenterLongitudeDeg;
          var relevancyRadius;
          try {
            zoneCenterLatitudeDeg = (function(){
              var zoneTopLatitudeDeg = 30;
              var ZONE_HEIGHT_IN_DEG = (1 / sails.config.custom.numZonesPerDegreeSquare);
              return zoneTopLatitudeDeg + (ZONE_HEIGHT_IN_DEG/2);
            })();
            zoneCenterLongitudeDeg = (function(){
              var zoneLeftLongitudeDeg = 97;
              var ZONE_WIDTH_IN_DEG = (1 / sails.config.custom.numZonesPerDegreeSquare);
              return zoneLeftLongitudeDeg + (ZONE_WIDTH_IN_DEG/2);
            })();
            relevancyRadius = (function(){
              var ZONE_HEIGHT_IN_DEG = (1 / sails.config.custom.numZonesPerDegreeSquare);
              var ZONE_WIDTH_IN_DEG = (1 / sails.config.custom.numZonesPerDegreeSquare);
              var zoneHeightKm = 111 * ZONE_HEIGHT_IN_DEG;
              var zoneWidthKm = Math.abs(Math.cos(zoneCenterLatitudeDeg)) * (111*ZONE_WIDTH_IN_DEG);
              var zoneEdgeHypotenuse = Math.sqrt(Math.pow(zoneHeightKm,2) + Math.pow(zoneWidthKm,2));
              sails.log.verbose('zoneWidthKm :: '+zoneWidthKm);
              sails.log.verbose('zoneHeightKm :: '+zoneHeightKm);
              sails.log.verbose('Math.pow(zoneHeightKm,2) :: '+Math.pow(zoneHeightKm,2));
              sails.log.verbose('Math.pow(zoneWidthKm,2) :: '+Math.pow(zoneWidthKm,2));
              sails.log.verbose('Math.sqrt(Math.pow(zoneHeightKm,2) + Math.pow(zoneWidthKm,2)) :: '+Math.sqrt(Math.pow(zoneHeightKm,2) + Math.pow(zoneWidthKm,2)));

              // This little guy forms something close to a "circle of best fit" in our
              // rectangular zone.
              return zoneEdgeHypotenuse;
            })();
          } catch (e) { return exits.error(e); }

          sails.log.verbose('Adjusted zone center coordinates: ('+zoneCenterLatitudeDeg+'° N,'+zoneCenterLongitudeDeg+'°)');
          sails.log.verbose('Relevancy radius: '+relevancyRadius);

          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          // FUTURE: To improve zone load time (esp. for the first load of the day for that zone),
          // use `async.auto` to fetch the weather and search tweets simultaneously.
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          (function cacheTweetsMaybe(proceed){

            try {

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

                sails.log.verbose('Searching for tweets from ('+30+'° N,'+97+'°)');
                sails.log.verbose('(Note that adjusted zone center coordinates will be used instead...)');

                Twitter.searchTweets({
                  bearerToken: bearerToken,
                  latitude: zoneCenterLatitudeDeg,
                  longitude: zoneCenterLongitudeDeg,
                  radius: relevancyRadius,
                  q: '-filter:retweets AND -filter:replies AND -filter:links AND filter:safe'
                }).exec(function(err, matchingTweets){
                  if (err) { return proceed(err); }

                  sails.log.verbose('Note: This is zone #'+zone.id+'...');
                  sails.log.verbose('%d matching tweets found:', matchingTweets.length, matchingTweets);

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
                  }, proceed);//</ Zone.update().exec() >
                });//</ Twitter.searchTweets() >
              });//</ Twitter.getBearerToken() >
            } catch (e) { return proceed(e); }

          })(function afterCachingTweets(err){
            if (err) { return exits.error(err); }

            User.update()
            .where({ username: thisUser.username })
            .set({
              currentZone: zone.id,
              lastActiveAt: Date.now()
            })
            .exec(function (err) {
              if (err) { return exits.error(err); }

              sails.log('@'+thisUser.username+' arrived in zone with coordinates: ( %d, %d )', x, y);

              try {
                // Subscribe to socket (RPS) notifications about this zone.
                Zone.subscribe(req, [zone.id]);

                // Publish this user's arrival to the new zone.
                Zone.publish([zone.id], {
                  verb: 'userArrived',
                  username: thisUser.username,
                  remark: thisUser.remark,
                  avatarColor: thisUser.avatarColor
                }, req);
              } catch (e) { return exits.error(e); }

              // Look up any OTHER users who are in this zone already.
              User.find({
                currentZone: zone.id,
                id: {'!=': thisUser.id}
              }).exec(function (err, otherUsersHere){
                if (err) { return exits.error(err); }

                // Build a formatted version of the cached tweets for this zone
                // that collates them by Twitter user.  In case there were multiple
                // recent tweets sent from this zone by the same person, note that
                // we use the most recent tweet.  (The following code also simplifies
                // tweet data to be _roughly_ consistent with our user records.)
                var strangersHere = [];
                try {
                  _.each(zone.cachedTweets, function (rawTweet){

                    // Compute a JS timestamp from this tweet's `created_at` property.
                    var tweetedAt = (new Date(rawTweet.created_at)).getTime();

                    var stranger = _.find(strangersHere, {twitterUsername: rawTweet.user.screen_name});
                    if (stranger) {
                      if (stranger.updatedAt < tweetedAt) {
                        // Tweet text already comes to us escaped (e.g. with '&amp;' instead of '&')
                        stranger.remark =  _.unescape(rawTweet.text);
                        stranger.createdAt = tweetedAt;
                        stranger.updatedAt = tweetedAt;
                      }
                    }
                    else {
                      strangersHere.push({
                        createdAt: tweetedAt,
                        updatedAt: tweetedAt,
                        // Tweet text already comes to us escaped (e.g. with '&amp;' instead of '&')
                        remark: _.unescape(rawTweet.text),
                        currentZone: zone.id,
                        avatarColor: '#1dcaff',
                        username: '@twitter:'+rawTweet.user.screen_name,

                        // Extra properties that _only_ strangers from Twitter have:
                        twitterUsername: rawTweet.user.screen_name,
                        twitterAvatarSrc: rawTweet.user.profile_image_url_https,
                      });
                    }

                  });
                } catch (e) { return exits.error(new Error('Unexpected error parsing tweets: '+e.stack)); }


                // Format list of users:
                var fullListOfOtherUsersHere = otherUsersHere.concat(strangersHere);
                fullListOfOtherUsersHere = _.sortBy(fullListOfOtherUsersHere, 'updatedAt');
                fullListOfOtherUsersHere.reverse();

                // Format weather data:
                var weatherData = {};
                weatherData.kind = zone.cachedWeather.weather[0].main;//'Thunderstorm', 'Drizzle', 'Rain', 'Snow', 'Atmosphere', 'Clear', 'Clouds', 'Extreme', or 'Additional'
                weatherData.description = zone.cachedWeather.weather[0].description;
                weatherData.temp = zone.cachedWeather.main.temp;
                weatherData.temp_min = zone.cachedWeather.main.temp_min;//eslint-disable-line camelcase
                weatherData.temp_max = zone.cachedWeather.main.temp_max;//eslint-disable-line camelcase
                // > (We just named our icons the same thing as the OpenWeatherMap
                // > icons, but prefixed with 'icon-weather-'.
                // > See https://openweathermap.org/weather-conditions for the list.)
                weatherData.iconClass = 'icon-weather-'+zone.cachedWeather.weather[0].icon;

                console.log('DONE! got the data.');
                return exits.success({
                  id: zone.id,
                  otherUsersHere: fullListOfOtherUsersHere,
                  relevancyRadius: relevancyRadius,
                  zoneCenterLatitudeDeg: zoneCenterLatitudeDeg,
                  zoneCenterLongitudeDeg: zoneCenterLongitudeDeg,
                  weather: weatherData,
                });

              }, exits.error);//</ User.find().exec() >
            }, exits.error);//</ User.update().exec() >
          });//</ cacheTweetsMaybe  (self-calling function) >
        });//</ cacheWeatherMaybe  (self-calling function) >
      }, exits.error);//</ Zone.findOne().exec() >
    }, exits.error);//</ User.findOne().exec() >

  }


};
