(function (){

  var PAGE_NAME = 'login';


  // Bail if this file isn't applicable.
  if ($('#'+PAGE_NAME).length === 0) { return; }


  // Set up the Vue instance for our login page
  var vm = new Vue({
    el: '#'+PAGE_NAME,

    data: {
      isSyncing: false,
      username: '',
      password: '',
      errorType: '',//'invalidCredentials', 'catchall', or ''
    },

    methods: {
      submitLoginForm: function() {
        vm.errorType = '';
        vm.isSyncing = true;

        io.socket.put('/login', {
          username: vm.username,
          password: vm.password,
        }, function(data, jwr) {
          if(jwr.error) {
          vm.isSyncing = false;
            switch(jwr.headers['x-exit']) {
              case 'notFound':
                vm.errorType = 'invalidCredentials';
                return;
              default:
                vm.errorType = 'catchall';
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


