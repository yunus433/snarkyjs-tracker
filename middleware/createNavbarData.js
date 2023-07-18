module.exports = (req, res, next) => {
  const member = req.session.member;

  const menu = {
    'Repositories': [
      { name: 'Overview', link: '/repositories' },
      { name: 'All Repositories', link: '/repositories/list' },
      { name: 'New Repository', link: '/repositories/create' },
      { name: 'Export Data', link: '/repositories/export' }
    ],
    'Developers': [
      { name: 'Overview', link: '/developers' },
      { name: 'All Developers', link: '/developers/list' },
      { name: 'New Developer', link: '/developers/create' },
      { name: 'Export Data', link: '/developers/export' }
    ]
  };

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