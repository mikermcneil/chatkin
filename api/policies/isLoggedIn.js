/**
 * isLoggedIn
 *
 * A simple policy that allows any request from an authenticated user.
 *
 * For more about how this policy works and how to use it, see:
 *   http://sailsjs.com/anatomy/api/policies/isLoggedIn.js
 */

module.exports = function isLoggedIn(req, res, proceed) {

  sails.helpers.checkAuth({ req:req })
  .exec({
    error: function(err) { return proceed(err); },
    notAuthenticated: function() {
      if (req.wantsJSON) { return res.forbidden(); }
      else { return res.redirect('/login'); }
    },
    success: function() { return proceed(); }
  });

};
