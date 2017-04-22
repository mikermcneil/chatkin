module.exports = {


  friendlyName: 'Set logged out',


  description: 'Set the session associated with this request as being logged out.',


  inputs: {
    req: { type: 'ref', required: true, description: 'The current request (`req`).' },
  },


  fn: function (inputs, exits) {

    var req = inputs.req;

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // Note: Depending on the use case, it sometimes makes sense to also invalidate
    // (read "destroy in the db") the access token, if one was provided.  In Chatkin,
    // we're assuming that tokens are multi-purpose and can be reused, so we don't
    // currently bother doing that here.  But we could!
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    if (!req.session) {
      return exits.error(new Error('Consistency violation: Session has been disabled!  This app cannot log out anything, since it can\'t get access to the session store.  (To "log out" when using token auth, just stop sending an X-Auth-Token header!)'));
    }

    delete req.session.userId;

    return exits.success();

  }


};
