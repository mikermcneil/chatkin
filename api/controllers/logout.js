module.exports = {


  friendlyName: 'Logout',


  description: 'Sign out of your account.',


  extendedDescription:
  'Only relevant for requests which use the session.\n'+
  '(To "log out" when using token auth, just stop sending the X-Auth-Token header!)',


  fn: async function (inputs, exits) {

    await sails.helpers.setLoggedOut({ req: this.req });
    return exits.success();

  }


};
