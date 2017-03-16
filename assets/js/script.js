// Come up with a username
var username = window.location.search.replace(/^\?/, '');

// If no username was specified, stop here.
if (!username) {
  throw new Error('No username specified.  Try again w/ a username to continue.');
}

// Otherwise, create our Vue instance
var homepage = new Vue({
  el: '#homepage',
  data: {
    activity: [],
    username: username
  },

  mounted: function() {
    // Get location from browser
    if (!navigator.geolocation){
      throw new Error('Geolocation is not supported by your browser.');
    }
    var $mainContent = document.getElementById('main-content');
    console.log('getting location from browser...');
    $mainContent.innerHTML = '<p>Getting location from browser...</p>';
    navigator.geolocation.getCurrentPosition(function gotLocation(geoPosition){
      console.log('• got it!', geoPosition);

      // Display map
      var $map = document.getElementById('map');
      var mapImg = new Image();
      mapImg.src = 'https://maps.googleapis.com/maps/api/staticmap?center=' + geoPosition.coords.latitude + ',' + geoPosition.coords.longitude + '&zoom=13&size=300x300&sensor=false';
      $map.appendChild(mapImg);

      // Communicate w/ server
      console.log('communicating with server...');
      $mainContent.innerHTML = '<p>Communicating with server...</p>';
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

        $mainContent.innerHTML = '<p>Welcome, '+this.username+'!</p>';
        console.log('It worked!  Now arrived in zone.');
        console.log('You can change your remark by running the following code:');
        console.log('```');
        console.log('io.socket.put(\'/user/'+this.username+'/remark\',{remark: \'hi\'},console.log.bind(console))');
        console.log('```');

        io.socket.on('zone', function(msg){
          console.log('* * Received zone notification from server with message:', msg);
          console.log('activity:', homepage.activity);
          homepage.activity.push(msg);
        });

      });
    }, function failedToGetLocation(err) {
      $mainContent.innerHTML = '<p>Failed to get location (see JS console for details)</p>';
      console.error('Could not load location.  (Please refresh the page and try again.)');
      console.error('Error details:');
      console.error(err);
    });
  }
});

