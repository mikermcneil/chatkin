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
      .exec(function(err, newUserRecord) {

        // Inspect the error and figure out what type of exit to return
        if(err) {

          // Check for a validation error (aka UNIQUENESS)
          if(err.code !== 'E_VALIDATION') {
            return exits.error(err);
          }
          // TODO: change this to the new way of negotiating (i.e. E_UNIQUE)

          // Grab the first invalid attribute and see what caused it. In this
          // case it *SHOULD* only ever be the violation of a uniqueness constraint.
          var invalidAttribute = _.first(_.keys(err.invalidAttributes));
          var duplicateError = _.find(err.invalidAttributes[invalidAttribute], { rule: 'unique'} );

          // If a duplicate error was found, call the correct exit based on
          // what the attribute was.
          if(duplicateError) {
            if(invalidAttribute === 'emailAddress') {
              return exits.emailAlreadyInUse();
            }
          }

          // Otherwise just exit with the error.
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

