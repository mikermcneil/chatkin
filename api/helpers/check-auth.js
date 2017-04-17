module.exports = {


  friendlyName: 'Check auth',


  description:
  'Check whether or not the incoming request includes valid authentication; '+
  'and if so, return the ID of the logged-in user record.',


  inputs: {
    req: { type: 'ref', required: true, description: 'The current request (`req`).' }
  },


  exits: {
    notAuthenticated: { description: 'This request is not authenticated.' },
    success: {
      outputFriendlyName: 'ID',
      outputDescription: 'The ID of the logged-in user.'
    }
  },


  fn: function (inputs, exits) {

    var req = inputs.req;

    var authToken = req.get('X-Auth-Token');

    // If no auth token was provided, then we'll assume the standard
    // session cookie approach is in use -- so we'll just check the session.
    if (!authToken) {
      if (!req.session) { return exits.error(new Error('Consistency violation: Session has been disabled!  Since there is no session, this app cannot check authentication status of requests unless they provide an "X-Auth-Token" header.')); }
      else if (!req.session.userId) { return exits.notAuthenticated(); }
      else { return exits.success(req.session.userId); }
    }//-•

    // Otherwise, we'll check on the provided auth token.
    User.find({ authToken: authToken })
    .exec(function(err, matchingUsers){
      if (err) { return exits.error(err); }
      if (matchingUsers.length > 1) { return exits.error(new Error('Consistency violation: The database is corrupted!  No two user records should ever share the same `authToken`-- but at least 2 users have `authToken: '+authToken+'`')); }
      if (matchingUsers.length === 0) { return exits.notAuthenticated(); }

      return exits.success(matchingUsers[0].id);
    });

  }


};
