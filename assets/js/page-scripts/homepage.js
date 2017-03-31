(function (){

  var PAGE_NAME = 'homepage';


  // Bail if this file isn't applicable.
  if ($('#'+PAGE_NAME).length === 0) { return; }

  // Set up the Vue instance for our homepage
  var vm = new Vue({

    el: '#'+PAGE_NAME,

    // Initialize data
    data: {

      // User info:
      me: {
        username: window.SAILS_LOCALS.username,
        avatarColor: window.SAILS_LOCALS.avatarColor,
        message: window.SAILS_LOCALS.remark,
      },

      // Zone info
      zone: {
        id: null,
        numOtherUsersHere: null,
        otherUsersHere: [],
      },

      // For loading states
      syncing: 'location', // 'location', 'chatkinServer', 'form', or ''

      // For error states
      errorType: '',// 'location' or ''

      // For showing/hiding popup menus
      visibleMenu: '',// 'zoneDetails', 'weatherDetails', or ''

      // For enabling/disabling the form
      editingMessage: false,
    },


    mounted: function() {
      // Get location from browser
      if (!navigator.geolocation){
        throw new Error('Geolocation is not supported by your browser.');
      }
      // If no username was specified, stop here.
      if(!window.SAILS_LOCALS.username) {
        console.error('No username specified.  Try again w/ a username to continue.');
        return;
      }


      // Otherwise, we have a username, so attempt to fetch the location.
      // console.log('getting location from browser...');
      navigator.geolocation.getCurrentPosition(function gotLocation(geoPosition){

        console.log('GEO:',geoPosition);

        // console.log('• got it!', geoPosition);
        // Done syncing location.
        vm.syncing = 'chatkinServer';

        // Communicate w/ server
        // console.log('communicating with server...');
        io.socket.put('/user/'+ window.SAILS_LOCALS.username +'/zone', {
          lat: geoPosition.coords.latitude,
          long: geoPosition.coords.longitude
        }, function(data, jwr){
          if (jwr.error) {
            console.error('Server responded with an error.  (Please refresh the page and try again.)');
            console.error('Error details:');
            console.error(jwr.error);
            vm.syncing = '';
            return;
          }//-•

          // Clear the loading state.
          vm.syncing = '';
          // Update our zone data.
          vm.zone.numOtherUsersHere = data.numOtherUsersHere;
          vm.zone.id = data.id;

          console.log('There are '+data.numOtherUsersHere+' other people here.');
          console.log('currentZone',vm.zone.id);

          console.log('It worked!  Now arrived in zone.');
          console.log('The weather in this zone is:',data.weather);
          console.log('You can change your remark by running the following code:');
          console.log('```');
          console.log('io.socket.put(\'/user/'+ window.SAILS_LOCALS.username +'/remark\',{remark: \'hi\'},console.log.bind(console))');
          console.log('```');


          // Compute zoom
          // ------------------------------------------------------------------
          //
          // Derivation:
          // ```
          // 142/7 = radiusKm/x
          // 142*x / 7 = radiusKm
          // 142x = radiusKm*7
          // x = radiusKm*7 / 142
          // ```
          //
          // Thus:
          // approximateZoomLevel = Math.min(MAX_ZOOM, radiusKm*7 / 142);
          //
          var zoom = (function(){

            var radiusKm = 142; // TODO: use real radiuskm from server

            var MAX_ZOOM = 21;
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            // ^^ Note that Google maps max zoom actually varies based on coordinates
            // (https://developers.google.com/maps/documentation/javascript/maxzoom).
            // But for our purposes, this is fine.  It's the max zoom in the middle
            // of nowhere out in the Pacific ocean.
            // (https://www.google.com/maps/@13.3428522,-133.3336917,21z)
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

            return Math.min(MAX_ZOOM, radiusKm*7 / 142);
          })();
          // ------------------------------------------------------------------

          // Display map
          var mapCenterLatitude = geoPosition.coords.latitude;// TODO: use real adjusted coordinates from server instead
          var mapCenterLongitude = geoPosition.coords.longitude;// TODO: use real adjusted coordinates from server instead
          var $mapImg = $('<img src="https://maps.googleapis.com/maps/api/staticmap?center=' + mapCenterLatitude + ',' + mapCenterLongitude + '&zoom='+zoom+'&size=200x200&sensor=false"/>');
          $('#map').append($mapImg);


          // Every time a "zone" socket event from the server arrives...
          io.socket.on('zone', function(msg){
            console.log('* * Received zone notification from server with message:', msg);

            // If this notification is about a user leaving the zone, remove the user
            // from the user interface.
            if (msg.verb === 'userLeft') {
              // If this notification is about the currently logged-in user,
              // just ignore it.
              // (This can happen if a user has multiple tabs open.)
              if(msg.username === vm.me.username) { return; }

              // Remove the user from the list of other users in the zone.
              _.remove(vm.zone.otherUsersHere, {username: msg.username});
              // Decrease the number of other users in this zone.
              vm.zone.numOtherUsersHere--;
            }
            // If it's about a new user joining the zone, add that user
            // to the UI.
            else if (msg.verb === 'userArrived') {
              // If this notification is about the currently logged-in user,
              // just ignore it.
              // (This can happen if a user has multiple tabs open.)
              if(msg.username === vm.me.username) { return; }
              // Also, if this notification is about a user who is already here,
              // ignore it.
              // (Also can happen if a user has multiple tabs open.)
              var userInZone = _.find(vm.zone.otherUsersHere, {username: msg.username});
              if(!_.isUndefined(userInZone)) { return; }

              // Increase the number of other users in the zone.
              vm.zone.numOtherUsersHere++;
              // Add the newly-arrived user to our list of `otherUsersHere`.
              vm.zone.otherUsersHere.unshift({
                username: msg.username,
                avatarColor: msg.avatarColor,
                remark: msg.remark
              });
            }
            // If this is about a user in this zone updating their remark,
            // update the remark in the UI.
            else if(msg.verb === 'userRemarked') {
              // If this notification is about the currently logged-in user,
              // just ignore it.
              // (This can happen if a user has multiple tabs open.)
              if(msg.username === vm.me.username) { return; }

              // Find the user in the `otherUsersHere` list.
              var userInZone = _.find(vm.zone.otherUsersHere, {username: msg.username});

              // FOR NOW:
              // If the user isn't in our list, assume they arrived before us
              // and add them.
              if(_.isUndefined(userInZone)) {
                vm.zone.otherUsersHere.unshift({
                  username: msg.username,
                  avatarColor: msg.avatarColor,
                  remark: msg.remark
                });
              }
              // Otherwise, update the existing user's remark.
              else {
                userInZone.remark = msg.remark;
              }

              // FUTURE:
              // if(!_.isUndefined(userInZone)) { throw new Error('Consistency violation: received a `userRemarked` notification for a user who is not in this zone.');}
              // // Update the user's remark.
              // userInZone.remark = msg.remark;
            }
            // Otherwise, we don't know wtf it is.
            else { throw new Error('Consistency violation: Unrecognized message received in "zone" socket event handler: '+JSON.stringify(msg)); }
          });//</ .on('zone') >

        });
      }, function failedToGetLocation(err) {
        vm.syncing = '';
        vm.errorType = 'location';
        console.error('Could not load location.  (Please refresh the page and try again.)');
        console.error('Error details:');
        console.error(err);

        throw new Error(err.code + ' :: ' + err.message);

      }, {

        // Under normal circumstances, we only fetch the location if it's been over a minute
        // since the last time location was retrieved on this device.
        maximumAge: 60000
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        // ^^NOTE:
        // In development, we *should* just be able to set this to `Infinity`, which is supposed
        // to tell the browser that the cached location should be used and skip querying:
        // ```
        // maximumAge: io.sails.environment !== 'production' ? Infinity : 60000
        // ```
        // (See https://developer.mozilla.org/en-US/docs/Web/API/PositionOptions for details)
        //
        // But unfortunately, it doesn't seem to be reliable, at least not in Chrome on desktop
        // for macOS (you still end up getting an error about 403s after a while.)
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

      });
    },//</mounted>


    methods: {
      updateRemark: function() {
        vm.editingMessage = false;
        io.socket.put('/user/'+vm.me.username+'/remark', {
          remark: vm.me.message
        }, function(data, jwr) {
          if (jwr.error) {
            console.error('Server responded with an error.  (Please refresh the page and try again.)');
            console.error('Error details:');
            console.error(jwr.error);
            // Re-enable the message field.
            vm.editingMessage = true;
            return;
          }//-•
        });
      },//</updateRemark>

      focusHiddenInput: function() {
        // If the zone info is still loading, or if we weren't able to get the location, bail.
        if(vm.syncing || vm.errorType) {
          console.log('still loading!!!');
          return;
        }

        // Otherwise, we have zone info, so focus the hidden input
        // to show the information.
        $('#zone-details-hidden-input').focus();
      },

      enableMessageField: function() {
        // Enable editing of the message.
        vm.editingMessage = true;
        // Focus the field. (We need to manually re-enable it first, because otherwise it will
        // still be disabled when this code runs.
        $('#update-remark-field').removeAttr('disabled').focus();
      }
    }//</methods>
  });




  // When the activity is updated...
  vm.$watch('activity', function() {
    // TODO: maybe autoscroll the message window.
  });



})();
