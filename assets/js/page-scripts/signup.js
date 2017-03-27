(function (){

  var PAGE_NAME = 'signup';


  // Bail if this file isn't applicable.
  if (!document.getElementById(PAGE_NAME)) { return; }


  // Set up the Vue instance for our signup page
  var vm = new Vue({
    el: '#'+PAGE_NAME,

    data: {
      isSyncing: false,
      username: '',
      password: ''
    },

    methods: {
      submitSignupForm: function() {
        vm.isSyncing = true;
        io.socket.put('/signup', {
          username: vm.username,
          password: vm.password,
        }, function(data, jwr) {
          vm.isSyncing = false;
          if(jwr.error) {
            switch(jwr.headers['x-exit']) {
              case 'emailAlreadyInUse':
                // TODO: show error message saying that username is taken
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


