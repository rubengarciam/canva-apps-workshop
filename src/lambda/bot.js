const axios = require('axios')
const qs = require('querystring')
const { TOKEN } = process.env

const ASANA_URL = "https://app.asana.com/api/1.0/"
const TASK_URL = ASANA_URL + "tasks/"
const PROJECT_URL = ASANA_URL + "projects/"
const SECTIONS_URL = ASANA_URL + "sections/"

const priority = {
  high: "!!!",
  medium: "!!",
  low: "!"
}

const due = {
  today: "#today",
  tomorrow: "#tomorrow",
  nextWeek: "#week",
  nextMonth: "#month"
}

function getProjectOwner (project, callback) {
  let url = PROJECT_URL + project
  let data = {
    project: project
  }
  axios.get(url, {
    headers: {
      'Authorization': TOKEN
    }
  }).then(res => {
    let project = res.data.data
    callback(project.owner)
  }).catch(error => {
    console.log('Retrieving project %d failed', project)
    return null
  })
}

// Updates contents of the new task
function assignOwner (task) {
  let url = TASK_URL + task.id
  let update = {}
  getProjectOwner(task.memberships[0].project.id, (owner) => {
    if (!owner) {
      throw "project has now owner"
    }
    if (!task.assignee) {
      update.assignee = owner.id
    }
    if (update === {}) {
      return
    }
    axios.put(url, qs.stringify(update), {
      headers: {
        'Authorization': TOKEN
      }
    }).then(res => {
      console.log('Task %d has new owner', task.id)
    }).catch(error => {
      console.log('Task %d owner failed', task.id)
      console.log(error.response.data.errors)
    })
  })
}

function completeTask (task) {
  let update = {
    completed: true
  }
  let url = TASK_URL + task.id
  axios.put(url, qs.stringify(update), {
    headers: {
      'Authorization': TOKEN
    }
  }).then(res => {
    console.log('Task %d completed', task.id)
  }).catch(error => {
    console.log('Task %d completed failed', task.id)
    console.log(error.response.data.errors)
  })
}

function moveToSectionDone (task) {
  let url = PROJECT_URL + task.memberships[0].project.id + '/sections'
  axios.get(url, {
    headers: {
      'Authorization': TOKEN
    }
  }).then(res => {
    let sections = res.data.data

    let update = {
      task: task.id
    }
    let url = SECTIONS_URL + sections[sections.length - 1].id + '/addTask'
    axios.post(url, qs.stringify(update), {
      headers: {
        'Authorization': TOKEN
      }
    }).then(res => {
      console.log('Task %d moved to done', task.id)
    }).catch(error => {
      console.log('Task %d moving to done failed', task.id)
      console.log(error.response.data.errors)
    })
  }).catch(error => {
    console.log('Task %d fetching sections failed', task.id)
    console.log(error.response.data.errors)
  })
}

function setProperties (task) {
  let update = {
    data: {}
  }
  var name = task.name
  var hasChanged = false

  // due date
  if (!task.due_on && !task.due_at) {
    var today = new Date()
    today = new Date(today.getFullYear(), today.getMonth(), today.getDate()-1) // fix offset +1
    var dueDate = null
    if (task.name.includes(due.today)) {
      // dueDate = today
      dueDate = new Date(Date.now())
      name = name.replace(due.today,"")
    } else if (task.name.includes(due.tomorrow)) {
      dueDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()+1)
      name = name.replace(due.tomorrow,"")
    } else if (task.name.includes(due.nextWeek)) {
      dueDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()+7)
      name = name.replace(due.nextWeek,"")
    }  else if (task.name.includes(due.nextMonth)) {
      dueDate = new Date(today.getFullYear(), today.getMonth()+1, today.getDate())
      name = name.replace(due.nextMonth,"")
    } else {
      let regex = /#(.*)days/
      let days = name.match(regex)
      if (days === null) {
          dueDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()+14)
      } else {
          console.log(days)
          dueDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()+parseInt(days[1], 10))
      }
    }
    update.data.due_on = dueDate.toISOString().slice(0, 10) // format YYYY-MM-DD
    hasChanged = true
  }

  // priority
  var priorityID = null

  if (task.name.includes(priority.high)) {
    priorityID = task.custom_fields[0].enum_options[0].gid
    name = name.replace(priority.high,"")
  } else if (task.name.includes(priority.medium)) {
    priorityID = task.custom_fields[0].enum_options[1].gid
    name = name.replace(priority.medium,"")
  } else if (task.name.includes(priority.low)) {
    priorityID = task.custom_fields[0].enum_options[2].gid
    name = name.replace(priority.low,"")
  }
  if (priorityID !== null) {
    let customFieldId = task.custom_fields[0].gid
    update.data.custom_fields = {
      '923557890290112': priorityID
    }
    hasChanged = true
  }

  if (!hasChanged) {
    return
  }

  update.data.name = name

  let url = TASK_URL + task.id
  console.log(update.data)
  axios.put(url, update, {
    headers: {
      'Authorization': TOKEN
    }
  }).then(res => {
    console.log('Task %d properties updated', task.id)
  }).catch(error => {
    console.log('Task %d properties failed', task.id)
    console.log(error.response.data.errors)
  })
}

// Iterates through events, looking for new tasks to assign
exports.handler = function (event, context, callback) {

  // console.log(event)

  // Validate if this is Setup phase
  let xHook = event.headers['x-hook-secret']
  if (xHook != null) {
    console.log("Hooking new webhook! ;)")
    callback(null, {
      statusCode: 200,
      headers: {
        'X-Hook-Secret': xHook
      },
      body: null
    })
    return
  }

  // Release webhook
  callback(null, {
    statusCode: 200,
    body: 'at work *beep!*'
  })

  // Parse contents
  JSON.parse(event.body).events.map((event) => {
    if ((event.type === 'task') && ((event.action === 'added') || (event.action === 'changed'))) {
      let url = TASK_URL + event.resource
      axios.get(url, {
        headers: {
          'Authorization': TOKEN
        }
      }).then(res => {
        let task = res.data.data

        // if task is completed
        if (task.completed) {
          if (task.memberships[0].section.name !== "Done") {
              moveToSectionDone(task)
          }
          return
        }

        // if task is moved to the completed section
        if (!task.completed && (task.memberships[0].section.name === "Done")) {
          completeTask(task)
          return
        }

        // new task
        if (event.action === 'added') {
          assignOwner(task)
        }
        // apply properties
        setProperties(task)

      }).catch(error => {
        console.log('Retrieving task %d failed', event.resource)
        console.log(error.response.data.errors)
      })
    }
  })
}
