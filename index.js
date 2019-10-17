const core = require('@actions/core');
const github = require('@actions/github');
const JiraApi = require('jira-client');

async function run() {
  try {
    const inputs = {
      token: core.getInput('repo-token', {required: true}),
      jiraToken: core.getInput('jira-token', {required: true}),
      jiraUser: core.getInput('jira-user', {required: true}),
    }

    var jira = new JiraApi({
      protocol: 'https',
      host: 'notarize.atlassian.net/',
      username: inputs.jiraUser,
      password: inputs.jiraToken,
      apiVersion: '2',
      strictSSL: true
    });
    const title = github.context.payload.pull_request.title;


    core.info(title);
    const storybook = title.includes('STORYBOOK');
    if (storybook) {
      core.warning("PR is storybook, all good"); 
      return;
    }

    core.info(title);
    const matches = title.match(/(\w+-\d+)/)
    if (!(matches)) {
      core.warning("Jira ticket not in PR title");
      core.setFailed();
      return;
    }
    const jiraTicketKey = matches[0];
    core.info(`Jira Ticket Key: ${jiraTicketKey}`);
    const issue = await jira.findIssue(jiraTicketKey);
    if (["In Review", "In Progress", "Done", "Staging"].includes(issue.fields.status.name)) {
      return;
    }
    core.setFailed("JIRA ticket does not have correct status");
  }
  catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
}

run()