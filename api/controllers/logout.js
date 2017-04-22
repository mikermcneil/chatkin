module.exports = {


  friendlyName: 'Logout',


  description: 'Sign out of your account.',


  extendedDescription:
  'Only relevant for requests which use the session.\n'+
  '(To "log out" when using token auth, just stop sending the X-Auth-Token header!)',


  fn: function (inputs, exits, env) {

    sails.helpers.setLoggedOut({ req: env.req })
    .exec({
      error: function (err) { return exits.error(err); },
      success: function () { return exits.success(); }
    });

  }


};
