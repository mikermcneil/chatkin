var sails = require('sails');
sails.load({
  environment: 'cron'
}, function (err){
  if(err) {
    console.error('Couldnt lift:'+err.stack);
    return;
  }

  require('machine-as-script')({

    habitat: 'sails',


    sails: sails,


    fn: function(inputs, exits) {
      User.find().exec(function(err, users){
        if(err) { return exits.error(err); }

        console.log('sails.config.isCron', sails.config.isCron);

        return exits.success();

      });
    }

  }).exec();

});


