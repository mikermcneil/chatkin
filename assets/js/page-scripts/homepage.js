(function (){

  var PAGE_NAME = 'homepage';


  // Bail if this file isn't applicable.
  if ($('#'+PAGE_NAME).length === 0) { return; }

  var username = $('#main-content').attr('data-logged-in-user');
  $('#main-content').removeAttr('data-logged-in-user');


  // Set up the Vue instance for our homepage
  var vm = new Vue({

    el: '#'+PAGE_NAME,

    // Initialize data
    data: {
      username: username,
      avatarColor: '',
      message: '',
      currentZone: null,
      numOthersInZone: null,
      syncingLocation: true,
      communicatingWithServer: false,
      errorFetchingLocation: false,
      zoneDetailsVisible: false,
      otherUsersHere: [],
      editingMessage: false,
      // A more descriptive error message for debugging in development:
      errorMsg: '',
    },


    mounted: function() {
      // Get location from browser
      if (!navigator.geolocation){
        throw new Error('Geolocation is not supported by your browser.');
      }
      // If no username was specified, stop here.
      if(!username) {
        console.error('No username specified.  Try again w/ a username to continue.');
        return;
      }


      // Otherwise, we have a username, so attempt to fetch the location.
      // console.log('getting location from browser...');
      navigator.geolocation.getCurrentPosition(function gotLocation(geoPosition){

        console.log('GEO:',geoPosition);

        // console.log('• got it!', geoPosition);
        // Done syncing location.
        vm.syncingLocation = false;
        vm.communicatingWithServer = true;

        // Communicate w/ server
        // console.log('communicating with server...');
        io.socket.put('/user/'+ username +'/zone', {
          lat: geoPosition.coords.latitude,
          long: geoPosition.coords.longitude
        }, function(data, jwr){
          if (jwr.error) {
            console.error('Server responded with an error.  (Please refresh the page and try again.)');
            console.error('Error details:');
            console.error(jwr.error);
            vm.communicatingWithServer = false;
            return;
          }//-•

          console.log('There are '+data.numOtherUsersHere+' other people here.');
          vm.numOthersInZone = data.numOtherUsersHere;
          vm.currentZone = data.id;
          console.log('currentZone',vm.currentZone);

          vm.communicatingWithServer = false;
          vm.arrived = true;
          console.log('It worked!  Now arrived in zone.');
          console.log('The weather in this zone is:',data.weather);
          console.log('You can change your remark by running the following code:');
          console.log('```');
          console.log('io.socket.put(\'/user/'+ username +'/remark\',{remark: \'hi\'},console.log.bind(console))');
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

            // Ignore messages that mention the currently-logged in user.
            if(msg.username === vm.username) { return; }//-•



            var userInZone = _.find(vm.otherUsersHere, {username: msg.username});
            if(!_.isUndefined(userInZone)) {
              userInZone.remark = msg.remark;
            }
            // If this notification is about a user leaving the zone, remove the user
            // from the user interface.
            else if (msg.verb === 'userLeft') {
              // TODO
            }
            // If it's about a new user joining the zone, add that user
            // to the UI.
            else if (msg.verb === 'userArrived') {
              vm.otherUsersHere.unshift({
                username: msg.username,
                avatarColor: msg.avatarColor,
                remark: msg.remark
              });
            }
            // Otherwise, we don't know wtf it is.
            else { throw new Error('Consistency violation: Unrecognized message received in "zone" socket event handler: '+msg); }

            // If a user arrived, increase the number of other users in this zone.
            if(msg.verb === 'userArrived') {
              vm.numOthersInZone++;
            }
            // If a user left, decrease the number of other users in this zone.
            else if(msg.verb === 'userLeft') {
              vm.numOthersInZone--;
            }
          });//</ .on('zone') >

        });
      }, function failedToGetLocation(err) {
        throw new Error(err.code + ' :: ' + err.message);
        // // FOR DEVELOPMENT:
        // // Show error message in the UI
        // if(!err.stack) {
        //   try {
        //     throw new Error(err);
        //   }
        //   catch(e) {
        //     vm.errorMsg = JSON.stringify(e.stack);
        //   }
        // }
        // else {
        //   vm.errorMsg = JSON.stringify(err.stack);
        // }
        // </ FOR DEVELOPMENT >

        vm.syncingLocation = false;
        vm.errorFetchingLocation = true;
        console.error('Could not load location.  (Please refresh the page and try again.)');
        console.error('Error details:');
        console.error(err);
      });
    },//</mounted>


    methods: {
      updateRemark: function() {
        io.socket.put('/user/'+vm.username+'/remark', {
          remark: vm.message
        }, function(data, jwr) {
          if (jwr.error) {
            console.error('Server responded with an error.  (Please refresh the page and try again.)');
            console.error('Error details:');
            console.error(jwr.error);
            return;
          }//-•

          // Update my remark in the UI.
          $('#my-remark').text(vm.message);
          vm.editingMessage = false;
        });
      },//</updateRemark>

      focusHiddenInput: function() {
        // If the zone info is still loading, or if we weren't able to get the location, bail.
        if(vm.syncingLocation || vm.communicatingWithServer || vm.errorFetchingLocation) {
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
