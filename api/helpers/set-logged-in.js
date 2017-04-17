module.exports = {


  friendlyName: 'Set logged in',


  description:
  'Using either the session or X-Set-Auth-Token response header, '+
  'set (i.e. "remember") the requesting user as being logged in, '+
  'and as being associated with the given user account.',


  inputs: {
    userId: { type: 'number', required: true, description: 'The ID of the user account the current request is authenticated as.' },
    req: { type: 'ref', required: true, description: 'The current request (`req`).' },
    res: { type: 'ref', required: true, description: 'The not-yet-sent response (`res`) for the current request.' },
  },


  fn: function (inputs, exits) {

    var req = inputs.req;
    var res = inputs.res;

    // If the X-Wants-Auth-Token request header was NOT set, then we'll assume
    // the standard session cookie approach is in use -- so we'll just set the
    // user id in the session.
    if (!req.get('X-Wants-Auth-Token')) {
      if (!req.session) { return exits.error(new Error('Consistency violation: Session has been disabled!  Since there is no session, this app cannot set authentication status for requests unless they provide an "X-Wants-Auth-Token" header.')); }
      req.session.userId = inputs.userId;
      return exits.success();
    }//-•

    // Otherwise, we'll generate an auth token, save it to the database,
    // and then set it as the X-Set-Auth-Token header in the response.
    var authToken = 'foo:'+Math.floor(Math.random()*10000);//TODO: make a proper token
    AuthToken.create({
      value: authToken,
      forUser: inputs.userId
    })
    .exec(function(err){
      if (err) { return exits.error(err); }
      res.set('X-Set-Auth-Token', authToken);
      return exits.success();
    });

  }


};
