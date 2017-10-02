module.exports = {


  friendlyName: 'Arrive',


  description: 'Arrive somewhere.',


  inputs: {
    lat: { type: 'number', required: true },
    long: { type: 'number', required: true },
  },


  exits: {

    success: {
      outputFriendlyName: 'Zone info',
      outputDescription: 'A dictionary of metadata about the zone this user has just wandered into.'
    },

    notAuthenticated: { statusCode: 401, description: 'Must be logged in.' },

  },


  fn: async function (inputs, exits) {

    var Twitter = require('machinepack-twitter');
    var OpenWeather = require('machinepack-openweather');

    // Get access to request instance.
    // (We'll use this for accessing the session and subscribing/publishing around the socket.)
    var req = this.req;


    // Temporarily allow non-socket requests for flexiblity during development:
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // if (!req.isSocket) {
    //   return exits.error(new Error('This is not a socket request.  (In order to arrive in a zone, you must use VR over socket.io -- i.e. `io.socket`)'));
    // }
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



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

    // Find the user who is currently logged in, and thus arriving in the zone.
    // (This is different between the web app and the mobile app-- hence our helper.)
    // > Note that you could also just as easily put this kind of "yes/no" check in
    // > a policy.  We're just avoiding that here to keep this example as simple as
    // > "magic-free" as possible.
    var loggedInUserId;
    try {
      loggedInUserId = await sails.helpers.checkAuth({req:req});
    } catch (err) {
      switch (err.code) {
        case 'notAuthenticated':
          return exits.notAuthenticated();
        default:
          throw err;
      }
    }

    var thisUser = await User.findOne({ id: loggedInUserId });
    if (!thisUser) { throw new Error('The requesting user is logged in as user `'+loggedInUserId+'`, but no such user exists in the database.  This should never happen!'); }

    // Unsubscribe this user from the old zone, and publish her departure
    // to update other clients' UIs.
    var alreadyInThisZone;
    if (thisUser.currentZone) {
      let oldZone = await Zone.findOne({id: thisUser.currentZone});
      if (oldZone && oldZone.x === x && oldZone.y === y) {
        alreadyInThisZone = true;
      }
      Zone.unsubscribe(req, [thisUser.currentZone]);
      Zone.publish([thisUser.currentZone], {
        verb: 'userLeft',
        username: thisUser.username
      }, req);
    }//ﬁ

    var zone;
    try {
      zone = await Zone.findOne({ x: x, y: y });
    } catch (err) {
      if (err.name === 'AdapterError') {
        throw new Error('Unexpeted adapter error!  Internal stack trace: '+err.raw.stack+'\n\nPrettified stack trace: '+err.stack);
      }
      throw err;
    }

    if (!zone) { throw new Error('Consistency violation: Expected Zone record to exist for coordinate ('+x+','+y+'), but it did not.  Are you sure the database is seeded with data?'); }


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // Note: The kind of caching logic below (for weather and tweets) could be extrapolated
    // into a generic "fetchAndCache" helper.  For an example of that, check out this commit:
    // https://github.com/mikermcneil/chatkin/commit/9a38001583d00d8b50fb8938d8f5cbcf7b63da99
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    if (!sails.config.custom.openWeatherApiKey) {
      sails.log.info('Using fake weather data...\n(To resolve, finish setting up relevant custom config.)');
      zone.cachedWeather = { weather: [{}], main: {} };
    }
    else {

      // Use cached weather, if possible -- as long as it's not too old.
      let rightNow = Date.now();
      let fourHoursAgo = rightNow - (1000*60*60*4);
      let tooStale = fourHoursAgo < zone.lastCachedWeatherAt;
      let isCorrupted = !tooStale && !zone.cachedWeather;
      if (tooStale || isCorrupted)  {

        // Fetch weather
        let weather;
        try {
          weather = await OpenWeather.getCurrentConditions({
            apiKey: sails.config.custom.openWeatherApiKey,
            latitude: inputs.lat,
            longitude: inputs.long,
          });

        } catch (err) {
          throw new Error(
            'Unable to get/cache weather data!  (Be sure to check your configuration, and/or the details below.)\n'+
            'Error details:\n'+
            '-- -- -- -- -- -- -- -- --\n'+
            err.stack+'\n'+
            '-- -- -- -- -- -- -- -- --'
          );
        }

        // Cache weather
        await Zone.update({ id: zone.id })
        .set({
          cachedWeather: weather,
          lastCachedWeatherAt: rightNow
        });

        // Stick the newly-fetched weather on our zone record
        // so we have it in the same format as if it was already
        // cached beforehand; just in case we want it that way
        // below.  (Makes it easier to think about.)
        zone.cachedWeather = weather;

      }//ﬁ

    }//ﬁ



    // Compute relevancy radius and adjusted lat/long:
    // > For more about what this is and why we have to compute
    // > it this way, see config/bootstrap.js.
    var zoneCenterLatitudeDeg = (()=>{
      var zoneTopLatitudeDeg = inputs.lat;
      var ZONE_HEIGHT_IN_DEG = (1 / sails.config.custom.numZonesPerDegreeSquare);
      return zoneTopLatitudeDeg + (ZONE_HEIGHT_IN_DEG/2);
    })();//†

    var zoneCenterLongitudeDeg = (()=>{
      var zoneLeftLongitudeDeg = inputs.long;
      var ZONE_WIDTH_IN_DEG = (1 / sails.config.custom.numZonesPerDegreeSquare);
      return zoneLeftLongitudeDeg + (ZONE_WIDTH_IN_DEG/2);
    })();//†

    var relevancyRadius = (()=>{
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
    })();//†

    sails.log.verbose('Adjusted zone center coordinates: ('+zoneCenterLatitudeDeg+'° N,'+zoneCenterLongitudeDeg+'°)');
    sails.log.verbose('Relevancy radius: '+relevancyRadius);

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // FUTURE: To improve zone load time (esp. for the first load of the day for that zone),
    // use `async.auto` (or something comparable) to fetch the weather and search tweets
    // simultaneously.
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    if (!sails.config.custom.twitterConsumerKey || !sails.config.custom.twitterConsumerSecret) {
      sails.log.info('Using fake Twitter data...\n(To resolve, finish setting up relevant custom config.)');
      zone.cachedTweets = [];
    }
    else {

      // Use cached tweets, if possible -- as long as they're not too old.
      let rightNow = Date.now();
      let twoHoursAgo = rightNow - (1000*60*60*2);
      let tooStale = twoHoursAgo < zone.lastCachedTweetsAt;
      let isCorrupted = !tooStale && !zone.cachedTweets;
      if (tooStale || isCorrupted)  {

        // FUTURE: Probably temporarily cache the bearer token, rather than looking it up every time.
        // (But note that it expires)
        let bearerToken = await Twitter.getBearerToken({
          consumerKey: sails.config.custom.twitterConsumerKey,
          consumerSecret: sails.config.custom.twitterConsumerSecret,
        });

        sails.log.verbose('Searching for tweets from ('+inputs.lat+'° N,'+inputs.long+'°)');
        sails.log.verbose('(Note that adjusted zone center coordinates will be used instead...)');

        let matchingTweets;
        try {
          matchingTweets = await Twitter.searchTweets({
            bearerToken: bearerToken,
            latitude: zoneCenterLatitudeDeg,
            longitude: zoneCenterLongitudeDeg,
            radius: relevancyRadius,
            q: '-filter:retweets AND -filter:replies AND -filter:links AND filter:safe'
          });
        } catch (err) {
          throw new Error(
            'Unable to get/cache relevant tweets!  (Be sure to check your configuration, and/or the details below.)\n'+
            'Error details:\n'+
            '-- -- -- -- -- -- -- -- --\n'+
            err.stack+'\n'+
            '-- -- -- -- -- -- -- -- --'
          );
        }
        sails.log.verbose('Note: This is zone #'+zone.id+'...');
        sails.log.verbose('%d matching tweets found:', matchingTweets.length, matchingTweets);

        // Cache tweets
        await Zone.update({ id: zone.id })
        .set({ cachedTweets: matchingTweets, lastCachedTweetsAt: rightNow });

        // Stick the newly-fetched tweets on our zone record
        // so we have it in the same format as if it was already
        // cached beforehand; just in case we want it that way
        // below.  (Makes it easier to think about.)
        zone.cachedTweets = matchingTweets;

      }//ﬁ
    }//ﬁ



    await User.update({
      username: thisUser.username
    })
    .set({
      currentZone: zone.id,
      lastActiveAt: Date.now()
    });

    if (alreadyInThisZone) {
      sails.log('@'+thisUser.username+' is loafing around in the same zone as last time: ( %d, %d )', x, y);
    }
    else {
      sails.log('@'+thisUser.username+' arrived in zone with coordinates: ( %d, %d )', x, y);
    }

    // Subscribe to socket (RPS) notifications about this zone.
    Zone.subscribe(req, [zone.id]);

    // Publish this user's arrival to the new zone.
    Zone.publish([zone.id], {
      verb: 'userArrived',
      username: thisUser.username,
      remark: thisUser.remark,
      avatarColor: thisUser.avatarColor
    }, req);

    // Look up any OTHER users who are in this zone already.
    var otherUsersHere = await User.find({
      currentZone: zone.id,
      id: {'!=': thisUser.id}
    });

    // Build a formatted version of the cached tweets for this zone
    // that collates them by Twitter user.  In case there were multiple
    // recent tweets sent from this zone by the same person, note that
    // we use the most recent tweet.  (The following code also simplifies
    // tweet data to be _roughly_ consistent with our user records.)
    var strangersHere = [];
    try {

      for (let rawTweet of zone.cachedTweets) {

        // Compute a JS timestamp from this tweet's `created_at` property.
        let tweetedAt = (new Date(rawTweet.created_at)).getTime();

        let stranger = _.find(strangersHere, {twitterUsername: rawTweet.user.screen_name});
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
      }//∞

    } catch (err) { throw new Error('Unexpected error parsing tweets: '+err.stack); }



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
    weatherData.iconClass = 'weather-'+zone.cachedWeather.weather[0].icon;

    return exits.success({
      id: zone.id,
      otherUsersHere: fullListOfOtherUsersHere,
      relevancyRadius: relevancyRadius,
      zoneCenterLatitudeDeg: zoneCenterLatitudeDeg,
      zoneCenterLongitudeDeg: zoneCenterLongitudeDeg,
      weather: weatherData,
      myRemark: thisUser.remark
    });

  }


};
