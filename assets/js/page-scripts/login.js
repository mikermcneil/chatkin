(function (){

  var PAGE_NAME = 'login';


  // Bail if this file isn't applicable.
  if (!document.getElementById(PAGE_NAME)) { return; }


  // Set up the Vue instance for our login page
  var vm = new Vue({
    el: '#'+PAGE_NAME,

    data: {
      isSyncing: false
    },

    methods: {
      submitLoginForm: function() {
        vm.isSyncing = true;
        io.socket.put('/login', {
          username: 'todo',
          password: 'todo',
        }, function(data, jwr) {
          vm.isSyncing = false;
          if(jwr.error) {
            switch(jwr.headers['x-exit']) {
              case 'notFound':
                // TODO: show error message saying the credentials are invalid
                return;
              default:
                console.error('Server responded with an error.  (Please refresh the page and try again.)');
                console.error('Error details:');
                console.error(jwr.error);
                return;
            }
          }//-*

          window.location = '/';


        });
      }
    }
  });


})();


