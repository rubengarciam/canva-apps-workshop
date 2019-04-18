# 🤖 Asana Bot --- WIP

This is a custom bot for [Asana](https://asana.com) that subscribes to projects and performs specific actions on the tasks.

It is designed to be deployed in [Netlify](https://netlify.com)'s Lambda functions. The button bellow will make your life easier but if you're keen to know more [here's a getting starter guide](https://www.netlify.com/docs/). And if you want to start from scratch [this blog post](https://travishorn.com/netlify-lambda-functions-from-scratch-1186f61c659e) has a fantastic step-by-step guide.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/rubengarciam/asana-bot)

## Bug, Feature Requests

You can request a new feature or submit a bug [through this form :)](https://form.asana.com?hash=5df822d4a56d6e20a4c50ee2bc85f690708f11eb080301a64233c16f9d457e38&id=1111668747986179)

## Functionality

#### New Task

- if has no assignee, the task is assigned to the owner of the project
- if has no due date, the task is assigned a default due date of 2 weeks from the creation date

#### [In development]

- Make the due date configurable as an environment variable
- Mark a task as completed when moved to the _Done_ board
- Move the task to the _Done_ board when marked as completed

## Configuration

You can use it with your own Asana account but I would recommend creating a separate one for the bot.

You will need to add the following [Netlify's environment variables](https://www.netlify.com/docs/continuous-deployment/#build-environment-variables):

- **TOKEN** - the account's Access Token (format _Bearer XXX_). [Here's how to get it](https://asana.com/guide/help/api/api)
- **BOT_URL** - the url where the bot is deployed (format _https://XYZ.netlify.com/.netlify/functions/bot_)

_Note:_ if you have deployed the bot using the Netlify's button above and created this variables afterwards, you will need to trigger a new deployment as the variables are linked in the deployment phase.

## How to get it working?

1. Invite the Asana bot account to the project. He will need _edit_ permissions
2. Unfortunately Asana has no api method, subscription or webhook to get notified for those actions (invited/removed from a project) so the subscription can't be automatised. You will need to make use of the included _/projects_ endpoint to manage such subscriptions (as per bellow)

## Manage subscriptions

This bot contains an endpoint at _https://XYZ.netlify.com/.netlify/functions/projects_ to manage its projects' subscriptions. Include the _TOKEN_ in the header.

#### Retrieve projects subscribed (for a specific workspace)

- Method: GET
- URL: https://XYZ.netlify.com/.netlify/functions/projects?workspace=WORKSPACE_ID

#### Subscribe to a project

- Method: POST
- URL: https://XYZ.netlify.com/.netlify/functions/projects
- Body:

```
{
  project: ID
}
```

#### Un-subscribe from a project

- Method: DELETE
- URL: https://XYZ.netlify.com/.netlify/functions/projects/WEBHOOK_ID

You can retrieve the webhook id from the GET method.
