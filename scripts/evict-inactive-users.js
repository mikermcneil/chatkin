module.exports = {


  description: 'Remove users who haven\'t been active for a few hours from their zones.',


  fn: async function(inputs, exits) {

    var MAX_INACTIVE_TIME =  Date.now()-(1000*60*60*4);

    // Track how many users got evicted.
    var numEvicted = 0;

    // Iterate over inactive users with non-null zones.
    await User.stream({
      where: {
        lastActiveAt: { '<':  MAX_INACTIVE_TIME },
        currentZone: { '!=': null }
      },
      select: User.hasSchema ? ['username', 'currentZone'] : undefined
      //^^ conditional to allow compatibility with sails-disk (i.e. during development)
    })
    .eachBatch(async function(theseInactiveUsers, next) {

      await User.update({
        id: { in: _.pluck(theseInactiveUsers, 'id') }
      })
      .set({
        currentZone: null
      });

      for (let inactiveUser of theseInactiveUsers) {
        if(_.isNull(inactiveUser.currentZone)) { continue; }

        sails.log.info('Publishing that inactive user (@'+inactiveUser.username+') has just left previous zone: '+inactiveUser.currentZone);
        Zone.publish([inactiveUser.currentZone], {
          verb: 'userLeft',
          username: inactiveUser.username
        });
      }//∞

      numEvicted += theseInactiveUsers.length;

      return next();

    });

    sails.log('Finished evicting %d inactive users.', numEvicted);
    return exits.success();

  }


};
