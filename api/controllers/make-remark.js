module.exports = {


  friendlyName: 'Make remark',


  description: 'Make a remark.',


  inputs: {
    username: { type: 'string', required: true },
    remark: { type: 'string', required: true },
  },


  exits: {

  },


  fn: function (inputs, exits) {

    User.update()
    .where({ username: inputs.username })
    .set({ remark: inputs.remark })
    .exec(function (err) {
      if (err) { return exits.error(err); }

      // Publish this user's new remark to his or her zone.
      Zone.publish(thisUser.currentZone, {
        verb: 'userRemarked',
        username: inputs.username,
        remark: thisUser.remark
      }, req);

      return exits.success();
    });

  }


};
