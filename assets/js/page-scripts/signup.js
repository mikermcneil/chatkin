(function (){

  var PAGE_NAME = 'signup';


  // Bail if this file isn't applicable.
  if ($('#'+PAGE_NAME).length === 0) { return; }


  // Set up the Vue instance for our signup page
  var vm = new Vue({
    el: '#'+PAGE_NAME,

    data: {
      isSyncing: false,
      username: '',
      password: '',
      passwordConfirmation: '',
      usernameTaken: false,
      passwordMatchError: false
    },

    methods: {
      submitSignupForm: function() {
        vm.usernameTaken = false;
        vm.passwordMatchError = false;
        vm.isSyncing = true;

        if(vm.password !== vm.passwordConfirmation) {
          vm.isSyncing = false;
          vm.passwordMatchError = true;
          return;
        }

        io.socket.put('/signup', {
          username: vm.username,
          password: vm.password,
        }, function(data, jwr) {
          vm.isSyncing = false;
          if(jwr.error) {
            switch(jwr.headers['x-exit']) {
              case 'emailAlreadyInUse':
                vm.usernameTaken = true;
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


