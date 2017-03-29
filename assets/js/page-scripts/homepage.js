(function (){

  var PAGE_NAME = 'homepage';


  // Bail if this file isn't applicable.
  if ($('#'+PAGE_NAME).length === 0) { return; }

  var username = $('#main-content').attr('data-logged-in-user');


  // Set up the Vue instance for our homepage
  var vm = new Vue({

    el: '#'+PAGE_NAME,

    // Initialize data
    data: {
      activity: [],
      username: username,
      avatarColor: '',
      message: '',
      currentZone: null,
      numOthersInZone: null,
      syncingLocation: true,
      communicatingWithServer: false,
      errorFetchingLocation: false,
      zoneDetailsVisible: false
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
          console.log('You can change your remark by running the following code:');
          console.log('```');
          console.log('io.socket.put(\'/user/'+ username +'/remark\',{remark: \'hi\'},console.log.bind(console))');
          console.log('```');

          // Display map
          var $mapImg = $('<img src="https://maps.googleapis.com/maps/api/staticmap?center=' + data.lat + ',' + data.long + '&zoom=7&size=200x200&sensor=false"/>');
          $('#map').append($mapImg);

          // When the socket connects
          io.socket.on('zone', function(msg){
            console.log('* * Received zone notification from server with message:', msg);
            vm.activity.push(msg);

            // If a user arrived, increase the number of other users in this zone.
            if(msg.verb === 'userArrived') {
              vm.numOthersInZone++;
            }
            // If a user left, decrease the number of other users in this zone.
            else if(msg.verb === 'userLeft') {
              vm.numOthersInZone--;
            }
          });

          // TODO:
          // Add another message for when someone leaves a zone.

        });
      }, function failedToGetLocation(err) {
        vm.syncingLocation = false;
        vm.errorFetchingLocation = true;
        console.error('Could not load location.  (Please refresh the page and try again.)');
        console.error('Error details:');
        console.error(err);
      });
    },//</mounted>


    methods: {
      updateRemark: function() {
        if(vm.message !== '') {
          io.socket.put('/user/'+vm.username+'/remark', {
            remark: vm.message
          }, function(data, jwr) {
            if (jwr.error) {
              console.error('Server responded with an error.  (Please refresh the page and try again.)');
              console.error('Error details:');
              console.error(jwr.error);
              return;
            }//-•

            vm.activity.push({
              verb: 'updatedMyRemark',
              username: vm.username,
              remark: vm.message
            });
          });
        }
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
    }//</methods>
  });




  // When the activity is updated...
  vm.$watch('activity', function() {
    // TODO: maybe autoscroll the message window.
  });



})();
