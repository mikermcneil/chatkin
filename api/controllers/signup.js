module.exports = {

  friendlyName: 'Signup',


  description: 'Sign up for a new account.',

  inputs: {

    username: {
      description: 'The desired username for the new user.',
      example: 'mikermcneil',
      required: true
    },

    password: {
      description: 'The unencrypted password to use for the new account.',
      example: 'password123',
      required: true
    },

    avatarColor: {
      description: 'The avatar color for the new user.',
      example: 'rgb(131,202,185)',
      required: true
    }

  },

  exits: {
    usernameAlreadyInUse: {
      statusCode: 409,
      description: 'The provided username is already in use.',
    }
  },

  fn: async function(inputs, exits) {

    // Encrypt the password
    var hashedPassword;
    try {
      hashedPassword = await sails.stdlib('passwords').hashPassword({
        password: inputs.password
      });
    } catch (err) { throw new Error('Cannot encrypt password: '+err.stack); }


    // Try to create a user record.
    var newUserRecord;
    try {
      newUserRecord = await User.create({
        username: inputs.username,
        password: hashedPassword,
        avatarColor: inputs.avatarColor
      })
      .fetch();
    } catch (err) {
      if(err.code === 'E_UNIQUE') {
        return exits.usernameAlreadyInUse(err);
      }
      throw err;
    }

    // --•
    // If we made it here, the user record was successfully created.
    // console.log('NEW USER RECORD:'+newUserRecord);

    // Mark the requesting agent as being logged in as this user.
    await sails.helpers.setLoggedIn({
      req: this.req,
      res: this.res,
      userId: newUserRecord.id
    });

    return exits.success();

  }

};

