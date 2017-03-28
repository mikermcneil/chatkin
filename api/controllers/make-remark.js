module.exports = {


  friendlyName: 'Make remark',


  description: 'Make a remark.',


  inputs: {
    username: { type: 'string', required: true },
    remark: { type: 'string', required: true },
  },


  exits: {
    userNotFound: { description: 'No such user.', statusCode: 400 }
  },


  fn: function (inputs, exits, env) {

    User.update()
    .where({ username: inputs.username })
    .set({ remark: inputs.remark })
    .meta({ fetch: true })
    .exec(function (err, users) {
      if (err) { return exits.error(err); }
      if (users.length > 1) { return exits.error(new Error('Consistency violation: Somehow, more than one user exists with the same username.  This should be impossible!')); }

      var thisUser = users[0];
      if (!thisUser) { return exits.userNotFound(); }

      // Publish this user's new remark to his or her zone.
      Zone.publish([thisUser.currentZone], {
        verb: 'userRemarked',
        username: inputs.username,
        remark: thisUser.remark,
        avatarColor: thisUser.avatarColor
      }, env.req);

      return exits.success();
    });

  }


};
