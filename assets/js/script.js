// Come up with a username
var username = window.location.search.replace(/^\?/, '');

// Set up the Vue instance for our homepage
var homepage = new Vue({
  el: '#homepage',

  // Initialize data
  data: {
    activity: [],
    username: username,
    message: '',
    syncingLocation: true,
    communicatingWithServer: false,
    errorFetchingLocation: false
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
    console.log('getting location from browser...');
    navigator.geolocation.getCurrentPosition(function gotLocation(geoPosition){
      console.log('• got it!', geoPosition);
      // Done syncing location.
      homepage.syncingLocation = false;
      homepage.communicatingWithServer = true;

      // Display map
      var $map = document.getElementById('map');
      var mapImg = new Image();
      mapImg.src = 'https://maps.googleapis.com/maps/api/staticmap?center=' + geoPosition.coords.latitude + ',' + geoPosition.coords.longitude + '&zoom=13&size=200x200&sensor=false';
      $map.appendChild(mapImg);

      // Communicate w/ server
      console.log('communicating with server...');
      io.socket.put('/user/'+this.username+'/zone', {
        lat: geoPosition.coords.latitude,
        long: geoPosition.coords.longitude
      }, function(data, jwr){
        if (jwr.error) {
          console.error('Server responded with an error.  (Please refresh the page and try again.)');
          console.error('Error details:');
          console.error(jwr.error);
          return;
        }//-•

        console.log('There are '+data+' other people here.');

        homepage.communicatingWithServer = false;
        console.log('It worked!  Now arrived in zone.');
        console.log('You can change your remark by running the following code:');
        console.log('```');
        console.log('io.socket.put(\'/user/'+this.username+'/remark\',{remark: \'hi\'},console.log.bind(console))');
        console.log('```');

        // When the socket connects
        io.socket.on('zone', function(msg){
          console.log('* * Received zone notification from server with message:', msg);
          console.log('activity:', homepage.activity);
          homepage.activity.push(msg);
        });

        // TODO:
        // Add another message for when someone leaves a zone.

      });
    }, function failedToGetLocation(err) {
      homepage.syncingLocation = false;
      homepage.errorFetchingLocation = true;
      console.error('Could not load location.  (Please refresh the page and try again.)');
      console.error('Error details:');
      console.error(err);
    });
  },//</mounted>


  methods: {
    updateRemark: function() {
      if(homepage.message !== '') {
        io.socket.put('/user/'+homepage.username+'/remark', {
          remark: homepage.message
        }, function(data, jwr) {
          if (jwr.error) {
            console.error('Server responded with an error.  (Please refresh the page and try again.)');
            console.error('Error details:');
            console.error(jwr.error);
            return;
          }//-•

          homepage.activity.push({
            verb: 'updatedMyRemark',
            username: homepage.username,
            remark: homepage.message
          });
        });
      }
    },//</methods>
  }
});

