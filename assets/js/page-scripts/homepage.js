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
        otherUsersHere: [],
      },

      // Weather info
      weather: {
        iconClass: '',
        kind: '',//'Thunderstorm', 'Drizzle', 'Rain', 'Snow', 'Atmosphere', 'Clear', 'Clouds', 'Extreme', or 'Additional'
        description: '',
        temp: null,
        temp_min: null, //eslint-disable-line camelcase
        temp_max: null //eslint-disable-line camelcase
      },

      // For loading states
      syncing: 'location', // 'location', 'chatkinServer', 'form', or ''

      // For error states
      errorType: '',// 'location' or ''

      // For showing/hiding popup menus
      visibleMenu: '',// 'zoneDetails', 'weatherDetails', or ''

      // For enabling/disabling the form
      editingMessage: false,

      // For discard / dirty checking
      oldMessage: '',
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


      // Bind a global keydown event to allow users to quickly begin composing
      // a message without using the mouse.
      $(window).on('keydown', function(e) {

        // If global keydown fires with any obvious alphanumeric key, we'll make
        // sure the chat text field is in an editable state and focused (unless
        // it's syncing, of course).
        if (vm.syncing) { return; }
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        // TODO: do nothing if ui is still initially loading, or if the remark is
        // currently being synced to the server:
        // ```
        // if (vm.syncingMessage) { return; }
        // ```
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

        // Look up the message field
        var $field = $('#update-remark-field');

        // Now we know the text field is NOT editable, so we'll make it editable,
        // focus it, highlight the text, and prevent the default behavior of this keydown
        // event.... well probably anyway.
        //
        // First let's make sure the keydown event came from a key we actually want
        // to respond to.
        var isAlphaNumeric = e.key && e.key.match(/^[a-z0-9]$/i) && !e.metaKey && !e.ctrlKey;

        // Handle DELETE/BACKSPACE key by clearing the remark.
        // > If currently in edit mode, or if the message was already cleared out,
        // > we ignore this keyboard event.
        if (e.key === 'Backspace' || e.key === 'Delete') {
          if (vm.editingMessage || vm.me.message === '') { return; }
          else {
            e.preventDefault();
            vm.updateRemark('');
          }
        }
        // Handle ESC key by canceling changes to the remark, if the text field is currently
        // in edit mode.  (Otherwise ignore this keyboard event.)
        else if (e.key === 'Escape') {
          if (!vm.editingMessage) { return; }
          else {
            e.preventDefault();
            vm.cancelEditingRemark();
          }
        }
        // Handle ENTER key by selecting everything inside of the text field.
        // (since this was spawned from the keyboard and no more precise motive can be assumed.)
        else if (e.key === 'Enter') {
          if (vm.editingMessage) { return; }
          else {
            e.preventDefault();
            vm.enableMessageField();
            $field.get(0).setSelectionRange(0, $field.get(0).value.length);
          }
        }
        // If alphanumeric, then we'll set the field equal to that key's string value.
        // (The user can press ENTER to cancel and revert the field's contents.)
        else if (isAlphaNumeric) {
          if (vm.editingMessage) { return; }
          else {
            e.preventDefault();
            vm.enableMessageField(e.key);
          }
        }
        // Otherwise, if since the key is neither alphanumeric nor ENTER, we'll ignore it.
        else {
          return;
        }


      });


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

          window.DATA = data;//todo: remove this-- it's just for debugging

          // Add formatted "time ago" to the other users' messages.
          _.each(data.otherUsersHere, function(otherUser) {
            var updatedAtTimeAgo = moment(otherUser.updatedAt).fromNow();
            otherUser.updatedAtTimeAgo = updatedAtTimeAgo;
          });

          // Update our zone data.
          vm.zone.id = data.id;
          vm.zone.otherUsersHere = data.otherUsersHere;
          vm.weather.kind = data.weather.weather[0].main;
          vm.weather.description = data.weather.weather[0].description;
          vm.weather.temp = data.weather.main.temp;
          vm.weather.temp_min = data.weather.main.temp_min;//eslint-disable-line camelcase
          vm.weather.temp_max = data.weather.main.temp_max;//eslint-disable-line camelcase
          // Determine the weather icon class.
          // (We just named our icons the same thing as the OpenWeatherMap
          // icons, but prefixed with 'icon-weather-'.
          // See https://openweathermap.org/weather-conditions for the list.)
          vm.weather.iconClass = 'icon-weather-'+data.weather.weather[0].icon;


          console.log('There are '+data.otherUsersHere.length+' other people here.');
          console.log(data.otherUsersHere);
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

              // Add the newly-arrived user to our list of `otherUsersHere`.
              vm.zone.otherUsersHere.unshift({
                username: msg.username,
                avatarColor: msg.avatarColor,
                remark: msg.remark,
                updatedAtTimeAgo: moment(userInZone.updatedAt).fromNow()
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
                  remark: msg.remark,
                  updatedAtTimeAgo: moment(userInZone.updatedAt).fromNow()
                });
              }
              // Otherwise, update the existing user's remark and 'time ago'.
              else {
                userInZone.remark = msg.remark;
                userInZone.updatedAtTimeAgo = moment(userInZone.updatedAt).fromNow();
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

      });//</ getCurrentPosition >
    },//</mounted>


    methods: {
      updateRemark: function(newMsg) {
        vm.editingMessage = false;
        // ^^TODO: consider a separate syncing state

        // If a new message was provided, set it.
        if (!_.isUndefined(newMsg)) {
          vm.me.message = newMsg;
        }

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

      submitNewRemark: function() {
        // If this is a mobile device, trigger a blur event on the field.
        // (This will submit the form without leaving it in an odd state.)
        if(bowser.mobile || bowser.tablet) {
          $('#update-remark-field').blur();
          return;
        }
        // Otherwise, this isn't a mobile device, so we'll just update it normally.
        vm.updateRemark();
      },

      submitNewRemarkMaybe: function() {
        // If this is a mobile device, submit the remark on blur.
        if(bowser.mobile || bowser.tablet) {
          vm.updateRemark();
        }
      },

      focusHiddenInput: function(menuType) {
        // If the zone info is still loading, or if we weren't able to get the location, bail.
        if(vm.syncing || vm.errorType) {
          return;
        }

        // Otherwise, we have zone info, so figure out
        // which hidden input to focus.
        switch(menuType) {
          case 'zoneDetails':
            $('#zone-details-hidden-input').focus();
            break;

          case 'weatherDetails':
            $('#weather-details-hidden-input').focus();
            break;

          default:
            throw new Error('Consistency violation: unknown `menuType` passed into focusHiddenInput().');
        }

      },

      clickMessageField: function(){
        vm.enableMessageField();
      },

      enableMessageField: function(newMsg) {
        // If the zone info is still loading, or if something went wrong, bail.
        if(vm.syncing || vm.errorType) { return; }
        // If we're already editing, bail.
        if (vm.editingMessage) { return; }
        // Track the original remark before any editing.
        vm.oldMessage = vm.me.message;
        // If a new message was provided, set it.
        if (!_.isUndefined(newMsg)) {
          vm.me.message = newMsg;
        }
        // Enable editing of the message.
        vm.editingMessage = true;
        // Focus the field. (We need to manually re-enable it first, because otherwise it will
        // still be disabled when this code runs.
        $('#update-remark-field').removeAttr('disabled').focus();
      },

      cancelEditingRemark: function (){
        // If the zone info is still loading, or if something went wrong, bail.
        if(vm.syncing || vm.errorType) { return; }
        // Disable editing of the message.
        vm.editingMessage = false;
        // Revert the field content
        vm.me.message = vm.oldMessage;
        // Disable the field.
        $('#update-remark-field').attr('disabled', 'disabled');
      }

    }//</methods>
  });




  // When the activity is updated...
  vm.$watch('activity', function() {
    // TODO: maybe autoscroll the message window.
  });



})();
