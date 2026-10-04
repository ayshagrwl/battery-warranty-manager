/**
 * AuthService.gs
 * Basic user identification and role-based permissions based on Google accounts.
 */

var AuthService = (function () {
  function getCurrentUser() {
    var email = Utils.getCurrentUserEmail();
    var users = Database.getRows('Users');

    for (var i = 0; i < users.length; i++) {
      if (String(users[i].email).toLowerCase() === email.toLowerCase()) {
        return {
          email: users[i].email,
          name: users[i].name || email,
          role: users[i].role || 'OPERATOR',
          status: users[i].status || 'ACTIVE'
        };
      }
    }

    // Default fallback when running as web app
    return {
      email: email,
      name: email.split('@')[0],
      role: 'OPERATOR',
      status: 'ACTIVE'
    };
  }

  function isAdmin() {
    var u = getCurrentUser();
    return u.role === 'ADMIN';
  }

  return {
    getCurrentUser: getCurrentUser,
    isAdmin: isAdmin
  };
})();
