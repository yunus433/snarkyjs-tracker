module.exports = (req, res, next) => {
  if (req.session.ADMIN_PASSWORD && req.session.ADMIN_PASSWORD == process.env.ADMIN_PASSWORD)
    return next();

  return res.status(401).redirect('/admin/login');
}