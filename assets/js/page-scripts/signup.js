(function (){

  var PAGE_NAME = 'signup';


  // Bail if this file isn't applicable.
  if ($('#'+PAGE_NAME).length === 0) { return; }

  // Get the initial randomized avatar color.
  var startingRed = (Math.floor(Math.random()*255));
  var startingGreen = (Math.floor(Math.random()*255));
  var startingBlue = (Math.floor(Math.random()*255));
  var startingColor = 'rgb('+startingRed+','+startingGreen+','+startingBlue+')';

  // Set up the Vue instance for our signup page
  var vm = new Vue({
    el: '#'+PAGE_NAME,

    data: {
      isSyncing: false,
      username: '',
      password: '',
      passwordConfirmation: '',
      usernameTaken: false,
      passwordMatchError: false,
      randomizedColor: startingColor
    },

    methods: {
      changeColor: function() {
        var red = (Math.floor(Math.random()*255));
        var green = (Math.floor(Math.random()*255));
        var blue = (Math.floor(Math.random()*255));

        vm.randomizedColor = 'rgb('+red+','+green+','+blue+')';
      },

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
          avatarColor: vm.randomizedColor
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


