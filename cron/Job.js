const cron = require('node-cron');

const createKeywordSearchTasks = require('./functions/createKeywordSearchTasks.js');
const createLanguageSearchTasks = require('./functions/createLanguageSearchTasks.js');
const deleteOldRemovedRepositories = require('./functions/deleteOldRemovedRepositories.js');
const performLatestTask = require('./functions/performLatestTask.js');

const ONE_MINUTE_IN_MS = 60 * 1000;
const TWO_SECONDS_IN_MS = 2 * 1000;

let lastKillTime = null;

const performLatestTasksForOneMinute = startTime => {
  if (lastKillTime >= startTime)
    return;
  if (Date.now() - startTime >= ONE_MINUTE_IN_MS)
    return;

  performLatestTask(err => {
    if (err) return console.error(`Cron Job Error at performLatestTask (${new Date}): ${err}`);

    setTimeout(() => performLatestTasksForOneMinute(startTime), TWO_SECONDS_IN_MS);
  });
};

const Job = {
  start: callback => {
    const job = cron.schedule('* * * * *', () => {
      deleteOldRemovedRepositories(err => {
        if (err) console.error(`Cron Job Error at deleteOldRemovedRepositories (${new Date}): ${err}`);
      });
      createKeywordSearchTasks(err => {
        if (err) console.error(`Cron Job Error at createKeywordSearchTasks (${new Date}): ${err}`);

        createLanguageSearchTasks(err => {
          if (err) console.error(`Cron Job Error at createLanguageSearchTasks (${new Date}): ${err}`);

          lastKillTime = Date.now();
          setTimeout(() => performLatestTasksForOneMinute(Date.now()), TWO_SECONDS_IN_MS);
        });
      });
    });

    setTimeout(() => {
      job.start();
      callback();
    }, 0);
  }
};

module.exports = Job;