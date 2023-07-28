module.exports = (req, res, next) => {
  const member = req.session.member;

  const menu = [
    {
      name: 'Repositories',
      link: '/repositories'
    },
    {
      name: 'Developers',
      link: '/developers'
    }
  ];

  res.locals.navbar = {
    title: member.name,
    subtitle: member.email,
    image: member.image,
    logout: '/auth/logout',
    menu
  };
  res.locals.member = member;

  return next();
}