module.exports = (req, res, next) => {
  const member = req.session.member;

  const menu = [
    {
      name: 'Repositories',
      link: '/repositories'
    },
    {
      name: 'Add Repository',
      link: '/repositories/add'
    },
    {
      name: 'Developers',
      link: '/developers'
    },
    {
      name: 'Settings',
      link: '/settings'
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