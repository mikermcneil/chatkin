module.exports = {


  friendlyName: 'Make remark',


  description: 'Make a remark.',


  inputs: {
    remark: { type: 'string', required: true },
  },


  exits: {
    notAuthenticated: { statusCode: 401, description: 'Must be logged in.' },
  },


  fn: async function (inputs, exits) {

    var req = this.req;

    // Find the user who is currently logged in, and thus arriving in the zone.
    // (This is different between the web app and the mobile app-- hence our helper.)
    //
    // > Note that you could also just as easily put this kind of "yes/no" check in
    // > a policy.  We're just avoiding that here to keep this example as simple as
    // > "magic-free" as possible.
    var loggedInUserId;
    try {
      loggedInUserId = await sails.helpers.checkAuth({req:req});
    } catch (err) {
      switch (err.code) {
        case 'notAuthenticated':
          return exits.notAuthenticated();
        default:
          throw err;
      }
    }

    var updatedUsers = await User.update({
      id: loggedInUserId
    })
    .set({ remark: inputs.remark })
    .fetch();

    if (updatedUsers.length > 1) { throw new Error('Consistency violation: Somehow, more than one user exists with the same username.  This should be impossible!'); }

    var thisUser = updatedUsers[0];
    if (!thisUser) { throw new Error('Consistency violation: The logged-in user has gone missing!  (Corresponding user record no longer exists in the database.)'); }

    try {
      // Publish this user's new remark to his or her zone.
      Zone.publish([thisUser.currentZone], {
        verb: 'userRemarked',
        username: thisUser.username,
        remark: thisUser.remark,
        avatarColor: thisUser.avatarColor
      }, req);
    } catch (err) { throw new Error('Unexpected error publishing new remark to zone: '+err.stack); }

    return exits.success();

  }


};
