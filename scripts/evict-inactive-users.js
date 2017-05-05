module.exports = {


  description: 'Remove users who haven\'t been active for a few hours from their zones.',


  habitat: 'sails',


  sails: require('sails'),


  fn: function(inputs, exits) {

    var MAX_INACTIVE_TIME =  Date.now()-(1000*60*60*4);

    // Track how many users got evicted.
    var numEvicted = 0;

    // Iterate over inactive users with non-null zones.
    User.stream({
      where: {
        lastActiveAt: { '<':  MAX_INACTIVE_TIME },
        currentZone: { '!=': null }
      },
      select: User.hasSchema ? ['username', 'currentZone'] : undefined
      //^^ conditional to allow compatibility with sails-disk (i.e. during development)
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
          if(_.isNull(inactiveUser.currentZone)) { return; }

          sails.log.info('Publishing that inactive user (@'+inactiveUser.username+') has just left previous zone: '+inactiveUser.currentZone);
          Zone.publish([inactiveUser.currentZone], {
            verb: 'userLeft',
            username: inactiveUser.username
          });
        });

        numEvicted += theseInactiveUsers.length;

        return next();

      }, next);//</ User.update().exec() >

    })
    .exec(function(err){
      if(err) { return exits.error(err); }

      sails.log('Finished evicting %d inactive users.', numEvicted);
      return exits.success();

    }, exits.error);//</ User.find().exec() >

  }


};
