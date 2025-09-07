// create a function to check the user session
function isAuthenticated(req, res, next) {
  if (!req.session.userId) {
    return res.redirect("/login");
  } next();
};

// creating a function for admin access to the admin panel
function authorize(allowedRoles) {
  return (req, res, next) => {
    if (!req.session.userId) return res.redirect("/login");
    if (!allowedRoles.includes(req.session.role)) {
      return res.status(403).send("Forbidden");
    }
    next();
  };
};

module.exports = { isAuthenticated, authorize };