module.exports = {


  friendlyName: 'Login',


  description: 'Login to your account.',


  inputs: {
    username: { type: 'string', required: true },
    password: { type: 'string', required: true }
  },


  exits: {
    notFound: { description: 'The provided username and password combination doesn\'t match any known user.', statusCode: 404 }
  },


  fn: function (inputs, exits) {
    this.req.session.userId = 1;
    return exits.success();

  }


};
