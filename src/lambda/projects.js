const axios = require('axios')
const qs = require('querystring')
const { TOKEN, BOT_URL } = process.env

exports.handler = function (event, context, callback) {
  // Getting all subscribed projects
  if (event.httpMethod == "GET"){
      let url = "https://app.asana.com/api/1.0/webhooks?workspace="+event.queryStringParameters.workspace
      axios.get(url, {
        headers: {
          'Authorization': TOKEN
        }
      }).then(res => {
        let webhooks = ""
        res.data.data.map(webhook => {
          webhooks += webhook.resource.name + " - "+ webhook.id + "  \n"
        })
        callback(null, {
          statusCode: 200,
          body: webhooks
        })
      }).catch(error => {
        // console.log(error.response.data.errors)
        callback(null, {
          statusCode: 200,
          body: 'Getting projects failed'
        })
      })
      return
  }
  // Adding a new webhook
  if (event.httpMethod == "POST"){
      console.log(event)
      let body = JSON.parse(event.body)

      let url = "https://app.asana.com/api/1.0/webhooks"
      let content = {
        target: BOT_URL,
        resource: body.project
      }
      axios.post(url, qs.stringify(content), {
        headers: {
          'Authorization': TOKEN
        }
      }).then(res => {
        callback(null, {
          statusCode: 200,
          body: 'Project added'
        })
      }).catch(error => {
        console.log(error.response.data.errors)
        callback(null, {
          statusCode: 200,
          body: 'Adding project failed'
        })
      })
      return
  }
  // Deleting webhook
  if (event.httpMethod == "DELETE"){
      console.log(event.path)
      items = event.path.split('/')
      let project = items.pop()
      // console.log(project)
      let url = "https://app.asana.com/api/1.0/webhooks/"+project
      axios.delete(url, {
        headers: {
          'Authorization': TOKEN
        }
      }).then(res => {
        callback(null, {
          statusCode: 200,
          body: 'Project removed'
        })
      }).catch(error => {
        console.log(error.response.data.errors)
        callback(null, {
          statusCode: 200,
          body: 'Removing project failed'
        })
      })
      return
  }
  callback(null, {
    statusCode: 200,
    body: 'Nothing to do'
  })
}
