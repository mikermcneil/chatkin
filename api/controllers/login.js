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


  fn: function (inputs, exits, env) {

    var passwords = require('machinepack-passwords');

    // Find the user record with the provided `username`
    User.findOne({
      username: inputs.username
    })
    .exec(function(err, userRecord) {
      if (err) { return exits.error(err); }

      // If there was no matching user, exit thru "notFound".
      if(!userRecord) {
        return exits.notFound();
      }

      // Otherwise, we have a user record,
      // so verify the password that was entered.
      passwords.checkPassword({
        passwordAttempt: inputs.password,
        encryptedPassword: userRecord.password
      })
      .exec({
        error: function(err) { return exits.error(err); },
        incorrect: function () {
          // If the password doesn't match, then also
          // exit thru "notFound" to prevent sniffing.
          return exits.notFound();
        },
        success: function (){

          // Mark the requesting agent as being logged in as this user.
          sails.helpers.setLoggedIn({
            req: env.req,
            res: env.res,
            userId: userRecord.id
          }).exec(function (err){
            if (err){ return exits.error(err); }
            return exits.success({
              username: userRecord.username,
              remark: userRecord.remark,
              avatarColor: userRecord.avatarColor
            });
          });

        }//</on success>
      });//</checkPassword().exec()>
    }, exits.error);//</User.findOne().exec()>

  }


};
