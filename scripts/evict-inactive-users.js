require('machine-as-script')({


  description: 'Remove users who haven\'t been active for a few hours from their zones.',


  habitat: 'sails',


  sails: require('sails'),


  fn: function(inputs, exits) {

    // Grab a list of inactive users with non-null zones.
    User.find({
      // TODO: add constraint so that this only applies to inactive users
      // '!=': null // TODO: put this back once it works
    })
    .exec(function(err, inactiveUsers){
      if(err) { return exits.error(err); }

      User.update({
        //todo
      })
      .set({
        currentZone: null
      })
      .exec(function(err){
        if(err) { return exits.error(err); }

        _.each(inactiveUsers, function(inactiveUser) {
          console.log('inactive user was in zone: '+inactiveUser.currentZone);
          if(_.isNull(inactiveUser.currentZone)) { return; }

          Zone.publish([inactiveUser.currentZone], {
            verb: 'userLeft',
            username: inactiveUser.username
          });
        });

        sails.log('Finished evicting %d inactive users.', inactiveUsers.length);

        return exits.success();

      }, exits.error);//</ User.update().exec() >
    }, exits.error);//</ User.find().exec() >

  }


}).exec();
