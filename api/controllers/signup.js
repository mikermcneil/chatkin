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
    }

  },

  exits: {
    usernameAlreadyInUse: {
      statusCode: 409,
      description: 'The provided username is already in use.',
    }

  },

  fn: function(inputs, exits, env) {
    var stdlib = require('sails-stdlib');

    // Encrypt the password
    stdlib('passwords').encryptPassword({
      password: inputs.password
    })
    .exec(function(err, hashedPassword) {
      if(err) { return exits.error(new Error('Cannot encrypt password: '+err.stack)); }

      // Try to create a user record.
      User.create({
        username: inputs.username,
        password: hashedPassword
      })
      .meta({ fetch: true })
      .exec(function(err, newUserRecord) {
        if(err) {
          if(err.code === 'E_UNIQUE') {
            return exits.emailAlreadyInUse(err);
          }
          return exits.error(err);
        }

        // --•
        // If we made it here, the user record was successfully created.
        console.log('NEW USER RECORD:'+newUserRecord);

        // Store the user id in the session
        env.req.session.userId = newUserRecord.id;

        return exits.success();

      });// </ User.create().exec() >
    });// </ stdlib('passwords').encryptPassword().exec() >

  }

};

