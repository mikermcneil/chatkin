module.exports = {


  friendlyName: 'Login',


  description: 'Login to your account.',


  inputs: {
    username: { type: 'string', required: true },
    password: { type: 'string', required: true }
  },


  exits: {

    success: {
      outputFriendlyName: 'Profile data',
      outputDescription: 'A dictionary of data about the logged-in user.'
    },

    notFound: {
      statusCode: 404,
      description: 'The provided username and password combination doesn\'t match any known user.'
    }

  },


  fn: async function (inputs, exits) {

    // Find the user record with the provided `username`
    var userRecord = await User.findOne({
      username: inputs.username
    });

    // If there was no matching user, exit thru "notFound".
    if(!userRecord) {
      return exits.notFound();
    }

    // Otherwise, we have a user record,
    // so verify the password that was entered.
    try {
      await sails.stdlib('passwords').checkPassword({
        passwordAttempt: inputs.password,
        hashedPassword: userRecord.password
      });
    } catch (err) {
      switch (err.code) {
        case 'incorrect':
          // If the password doesn't match, then also
          // exit thru "notFound" to prevent sniffing.
          return exits.notFound();
        default:
          throw err;
      }
    }

    // Mark the requesting agent as being logged in as this user.
    await sails.helpers.setLoggedIn({
      req: this.req,
      res: this.res,
      userId: userRecord.id
    });

    return exits.success({
      username: userRecord.username,
      remark: userRecord.remark,
      avatarColor: userRecord.avatarColor
    });

  }


};
