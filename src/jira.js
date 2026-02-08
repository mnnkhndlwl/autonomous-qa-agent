const axios = require('axios');

function getAuth() {
  const baseUrl = process.env.JIRA_BASE_URL;
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;

  if (!baseUrl || !email || !token) {
    throw new Error('Missing Jira credentials. Set JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN.');
  }

  return { baseUrl, email, token };
}

async function postComment(issueKey, bodyText) {
  if (!issueKey) {
    throw new Error('Missing Jira issue key.');
  }

  const { baseUrl, email, token } = getAuth();
  const url = `${baseUrl.replace(/\/$/, '')}/rest/api/3/issue/${issueKey}/comment`;

  await axios.post(
    url,
    { body: bodyText },
    {
      auth: {
        username: email,
        password: token
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }
  );
}

module.exports = { postComment };
