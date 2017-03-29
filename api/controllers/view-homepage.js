module.exports = {


  friendlyName: 'View homepage',


  description: 'Show the homepage (if logged in) or otherwise, redirect to the login page.',


  inputs: {

  },


  exits: {

    success: {
      responseType: 'view',
      viewTemplatePath: 'homepage'
    },

    notLoggedIn: {
      responseType: 'redirect'
    }
  },


  fn: function (inputs, exits, env) {

    // Check if the requesting user is logged in.
    // If not, then bail.
    if (!env.req.session.userId) {
      return exits.notLoggedIn('/login');
    }// --•

    // Otherwise IWMIH, we know the current user is logged in.
    // So look up the record in the database that represents this logged in user.
    User.findOne({
      id: env.req.session.userId
    }).exec(function (err, loggedInUserRecord) {

      if (err) { return exits.error(err); }

      if (!loggedInUserRecord) {
       return exits.error(new Error('The requesting user is logged in as user `'+env.req.session.userId+'`, but no such user exists in the database.  This should never happen!'));
      }

      console.log(loggedInUserRecord);
      // Then respond with HTML.
      return exits.success({
        username: loggedInUserRecord.username,
        remark: loggedInUserRecord.remark
      });

    });//</User.findOne()>

  }


};

