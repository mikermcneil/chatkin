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
      skinTone: '',
      message: '',
      numOthersInZone: null,
      syncingLocation: true,
      communicatingWithServer: false,
      errorFetchingLocation: false,
      arrived: false
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

        // Display map
        var $mapImg = $('<img src="https://maps.googleapis.com/maps/api/staticmap?center=' + geoPosition.coords.latitude + ',' + geoPosition.coords.longitude + '&zoom=13&size=200x200&sensor=false"/>');
        $('#map').append($mapImg);

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

          console.log('There are '+data+' other people here.');
          vm.numOthersInZone = data;

          vm.communicatingWithServer = false;
          vm.arrived = true;
          console.log('It worked!  Now arrived in zone.');
          console.log('You can change your remark by running the following code:');
          console.log('```');
          console.log('io.socket.put(\'/user/'+ username +'/remark\',{remark: \'hi\'},console.log.bind(console))');
          console.log('```');

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
    }//</methods>
  });




  // When the activity is updated...
  vm.$watch('activity', function() {
    // TODO: maybe autoscroll the message window.
  });



})();
