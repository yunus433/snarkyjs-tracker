const cron = require('node-cron');

const checkBacklog = require('./functions/checkBacklog.js');
const createKeywordSearchTasks = require('./functions/createKeywordSearchTasks.js');
const createLanguageSearchTasks = require('./functions/createLanguageSearchTasks.js');
const performLatestTask = require('./functions/performLatestTask.js');

const ONE_MINUTE_IN_MS = 60 * 1000;
const REQUEST_INTERVAL = 360;

let lastKillTime = null;
let latestTaskID = null;

const performLatestTasksForOneMinute = startTime => {
  if (lastKillTime >= startTime)
    return;
  if (Date.now() - startTime >= ONE_MINUTE_IN_MS)
    return;

  performLatestTask(latestTaskID, (err, newLatestTaskID) => {
    if (err) return console.error(`Cron Job Error at performLatestTask (${new Date}): ${err}`);
    if (newLatestTaskID)
      latestTaskID = newLatestTaskID;

    setTimeout(() => performLatestTasksForOneMinute(startTime), REQUEST_INTERVAL);
  });
};

const Job = {
  start: callback => {
    const job = cron.schedule('* * * * *', () => {
      console.log("here");
      checkBacklog(err => {
        if (err) console.error(`Cron Job Error at checkBacklog (${new Date}): ${err}`);
      });
      createKeywordSearchTasks(err => {
        if (err) console.error(`Cron Job Error at createKeywordSearchTasks (${new Date}): ${err}`);

        createLanguageSearchTasks(err => {
          if (err) console.error(`Cron Job Error at createLanguageSearchTasks (${new Date}): ${err}`);

          lastKillTime = Date.now();
          setTimeout(() => performLatestTasksForOneMinute(Date.now()), REQUEST_INTERVAL);
        });
      });
    });

    setTimeout(() => {
      job.start();
      callback();
    }, REQUEST_INTERVAL);
  }
};

module.exports = Job;