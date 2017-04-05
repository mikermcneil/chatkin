require('machine-as-script')({


  description: 'Remove users who haven\'t been active for a few hours from their zones.',


  habitat: 'sails',


  sails: require('sails'),


  fn: function(inputs, exits) {

    User.update({
      //todo
    })
    .set({
      currentZone: null
    })
    .exec(function(err){
      if(err) { return exits.error(err); }

      sails.log('Finished evicting inactive users.');

      return exits.success();

    });
  }


}).exec();
