const axios = require("axios");
const qs = require("querystring");
const { TOKEN } = process.env;

const ASANA_URL = "https://app.asana.com/api/1.0/";
const TASK_URL = ASANA_URL + "tasks/";
const PROJECT_URL = ASANA_URL + "projects/";
const SECTIONS_URL = ASANA_URL + "sections/";

// Create a task in Asana
function createTask (project, callback) {
    let url = PROJECT_URL + project
    let data = {
        name: "planning #10",
        notes: "10 asasd",
        projects: [
          project
        ]
    }
    axios.post(url, {
      headers: {
        'Authorization': TOKEN
      }
    }).then(res => {
      let project = res.data.data
          // Release webhook
    callback(null, {
        statusCode: 200,
        body: 'at work *beep!*'
      })
    }).catch(error => {
      console.log('Retrieving project %d failed', project)
      callback(null, {
        statusCode: 404,
        body: 'Error creating the task'
      });
    })
  }

// Handler
exports.handler = function(event, context, callback) {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    //return { statusCode: 405, body: "Method Not Allowed" };
    // Release webhook
    callback(null, {
      statusCode: 405,
      body: 'Method Not Allowed'
    });
  } else {
    console.log(event);
    console.log(context);
    
    createTask('',callback)
  
  }
};
