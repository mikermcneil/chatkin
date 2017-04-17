module.exports = {


  friendlyName: 'Set logged out',


  description: 'Set the session associated with this request as being logged out.',


  inputs: {
    req: { type: 'ref', required: true, description: 'The current request (`req`).' },
  },


  fn: function (inputs, exits) {

    var req = inputs.req;

    if (!req.session) {
      return exits.error(new Error('Consistency violation: Session has been disabled!  This app cannot log out anything, since it can\'t get access to the session store.  (To "log out" when using token auth, just stop sending an X-Auth-Token header!)'));
    }

    delete req.session.userId;

    return exits.success();

  }


};
