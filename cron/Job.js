const cron = require('node-cron');

const checkBacklog = require('./functions/checkBacklog.js');
const createSearchTasks = require('./functions/createSearchTasks.js');
const performLatestTask = require('./functions/performLatestTask.js');

const ONE_MINUTE_IN_MS = 60 * 1000;
const ONE_SECOND_IN_MS = 1000;
const REQUEST_INTERVAL = 360;

let lastKillTime = null;

const performLatestTasksForOneMinute = startTime => {
  if (lastKillTime >= startTime)
    return;
  if (Date.now() - startTime >= ONE_MINUTE_IN_MS)
    return;

  performLatestTask(err => {
    if (err) console.error(`Cron Job Error at performLatestTask (${new Date}): ${err}`);

    setTimeout(() => performLatestTasksForOneMinute(startTime), REQUEST_INTERVAL);
  });
};

const Job = {
  start: callback => {
    const job = cron.schedule('* * * * *', () => {
      console.log('Cron Job: ', new Date());

      checkBacklog(err => {
        if (err) console.error(`Cron Job Error at checkBacklog (${new Date}): ${err}`);
      });

      createSearchTasks(err => {
        if (err) console.error(`Cron Job Error at createSearchTasks (${new Date}): ${err}`);

        lastKillTime = Date.now();
        setTimeout(() => performLatestTasksForOneMinute(Date.now()), ONE_SECOND_IN_MS);
      });
    });

    setTimeout(() => {
      job.start();
      callback();
    }, REQUEST_INTERVAL);
  }
};

module.exports = Job;