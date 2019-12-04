const axios = require('axios')
const qs = require('querystring')
const { TOKEN } = process.env

const ASANA_URL = "https://app.asana.com/api/1.0/"
const TASK_URL = ASANA_URL + "tasks/"
const PROJECT_URL = ASANA_URL + "projects/"
const SECTIONS_URL = ASANA_URL + "sections/"

// Handler
exports.handler = function (event, context, callback) {

  console.log(event)
  console.log(context)

  // Release webhook
  callback(null, {
    statusCode: 200,
    body: 'at work *beep!*'
  })

}
