module.exports = {


  friendlyName: 'View homepage',


  description: 'Show the homepage (if logged in) or otherwise, redirect to the login page.',


  exits: {

    success: {
      responseType: 'view',
      viewTemplatePath: 'homepage'
    },

    notLoggedIn: {
      responseType: 'redirect',
      description: 'Requesting user was not authenticated.',
      extendedDescription: 'You must be logged in to be allowed to view a zone page.'
    }

  },


  fn: async function (inputs, exits) {

    var req = this.req;

    // Check if the requesting user is logged in.
    // If not, then bail.
    if (!req.session) { return exits.error(new Error('Consistency violation: Session has been disabled!  Since there is no session, this app cannot serve the home page.')); }
    if (!req.session.userId) {
      return exits.notLoggedIn('/login');
    }// --•

    // Otherwise IWMIH, we know the current user is logged in.
    // So look up the record in the database that represents this logged in user.
    var loggedInUserRecord = await User.findOne({
      id: req.session.userId
    });

    if (!loggedInUserRecord) {
      return exits.error(new Error('Consistency violation: The requesting user is logged in as user `'+req.session.userId+'`, but no such user exists in the database.  This should never happen!'));
    }

    // Then respond with HTML.
    return exits.success({
      username: loggedInUserRecord.username,
      remark: loggedInUserRecord.remark,
      avatarColor: loggedInUserRecord.avatarColor
    });

  }


};

