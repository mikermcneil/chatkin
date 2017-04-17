module.exports = {


  friendlyName: 'Set logged out',


  description: 'If relevant, set the session associated with this request as being logged out.',


  inputs: {
    req: { type: 'ref', required: true, description: 'The current request (`req`).' },
  },


  fn: function (inputs, exits) {

    var req = inputs.req;

    if (req.session) {
      delete req.session.userId;
    }

    return exits.success();

  }


};
