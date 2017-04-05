require('machine-as-script')({


  description: 'Remove users who haven\'t been active for a few hours from their zones.',


  habitat: 'sails',


  sails: require('sails'),


  fn: function(inputs, exits) {

    var MAX_INACTIVE_TIME =  Date.now()-(1000*60*60*4);

    // Iterate over inactive users with non-null zones.
    User.stream({

      lastActiveAt: { '<':  MAX_INACTIVE_TIME }

      // currentZone: { '!=': null } // TODO: put this back once it works
    })
    .eachBatch(function(theseInactiveUsers, next) {

      User.update({
        id: { in: _.pluck(theseInactiveUsers, 'id') }
      })
      .set({
        currentZone: null
      })
      .exec(function(err){
        if(err) { return next(err); }

        _.each(theseInactiveUsers, function(inactiveUser) {
          console.log('inactive user was in zone: '+inactiveUser.currentZone);
          if(_.isNull(inactiveUser.currentZone)) { return; }

          Zone.publish([inactiveUser.currentZone], {
            verb: 'userLeft',
            username: inactiveUser.username
          });
        });

        sails.log('Finished evicting %d inactive users.', theseInactiveUsers.length);

        return next();

      }, next);//</ User.update().exec() >

    })
    .exec(function(err){
      if(err) { return exits.error(err); }
      return exits.success();
    }, exits.error);//</ User.find().exec() >

  }


}).exec();
