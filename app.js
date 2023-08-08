const bodyParser = require('body-parser');
const cluster = require('cluster');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');
const dotenv = require('dotenv');
const express = require('express');
const favicon = require('serve-favicon');
const http = require('http');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');

const MongoStore = require('connect-mongo');

dotenv.config({ path: path.join(__dirname, '.env') });
const CLUSTER_COUNT = process.env.WEB_CONCURRENCY || require('os').cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  for (let i = 0; i < CLUSTER_COUNT; i++)
    cluster.fork();

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  const app = express();
  const server = http.createServer(app);

  const IS_LOCAL = process.env.IS_LOCAL ? JSON.parse(process.env.IS_LOCAL) : false;
  const PORT = process.env.PORT || 3000;
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/snarkyjs-tracker';
  const QUERY_LIMIT = 20;

  const Job = require('./cron/Job');

  const adminRouteController = require('./routes/adminRoute');
  const authRouteController = require('./routes/authRoute.js');
  const developersRouteController = require('./routes/developersRoute');
  const indexRouteController = require('./routes/indexRoute');
  const repositoriesRouteController = require('./routes/repositoriesRoute');
  const settingsRouteController = require('./routes/settingsRoute');

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'pug');

  mongoose.set('strictQuery', false);
  mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  app.use(express.static(path.join(__dirname, 'public')));
  app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));

  const sessionOptions = session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGODB_URI
    })
  });

  app.use(cookieParser());
  app.use(sessionOptions);

  app.use((req, res, next) => {
    if (!req.query || typeof req.query != 'object')
      req.query = {};
    if (!req.body || typeof req.body != 'object')
      req.body = {};

    res.locals.QUERY_LIMIT = QUERY_LIMIT;
    req.query.limit = QUERY_LIMIT;

    next();
  });

  app.use('/', indexRouteController);
  app.use('/admin', adminRouteController);
  app.use('/auth', authRouteController);
  app.use('/developers', developersRouteController);
  app.use('/repositories', repositoriesRouteController);
  app.use('/settings', settingsRouteController);

  server.listen(PORT, () => {
    console.log(`Server is on port ${PORT} as Worker ${cluster.worker.id} running @ process ${cluster.worker.process.pid}`);
    if (!IS_LOCAL && (CLUSTER_COUNT == 1 || cluster.worker.id % CLUSTER_COUNT == 1))
      Job.start(() => {
        console.log(`Cron Jobs are started on Worker ${cluster.worker.id}`);
      });
  });
}