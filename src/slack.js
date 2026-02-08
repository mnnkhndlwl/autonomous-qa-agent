const axios = require('axios');

async function notifySlack(message) {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) {
    throw new Error('Missing SLACK_WEBHOOK_URL.');
  }

  await axios.post(webhook, { text: message });
}

module.exports = { notifySlack };
