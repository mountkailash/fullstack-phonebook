const express = require('express')
const app = express()

app.use(express.json())

const morgan = require('morgan')
app.use(morgan('tiny', {stream: process.stdout}))
app.use(morgan(':method :url :status :response-time ms - :res[content-length] :postData', {stream: process.stdout}))

const cors = require('cors')
app.use(cors())

app.use(express.static('dist'))

let persons = [
  {
    "id": 1,
    "name": "Arto Hellas",
    "number": "040-123456"
  },
  {
    "id": 2,
    "name": "Ada Lovelace",
    "number": "39-44-5323523"
  },
  {
    "id": 3,
    "name": "Dan Abramov",
    "number": "12-43-234345"
  },
  {
    "id": 4,
    "name": "Mary Poppendieck",
    "number": "39-23-6423122"
  }
]

app.get('/', (request, response) => {
  response.send('<h1>Hello world</h1>')
})

app.get('/api/persons', (request, response) => {
  response.json(persons)
})

app.get('/api/persons/:id', (request, response) => {
  const id = Number(request.params.id)
  console.log(id)
  const person = persons.find(person => person.id === id)
  console.log(person)

  if (person) {
    response.json(person)
  } else {
    response.status(404).end()
  }
})

app.get('/info', (request, response) => {

  const personsCount = persons.length
  const currentDate = new Date()
  response.send(
    `<p>phonebook has info for ${personsCount} people
    <p>${currentDate}</p> 
    `)
  console.log(response)
})

const generateRandomId = () => {
  const minId = 1
  const maxId = 99999

  const randomId = Math.floor(Math.random() * (maxId - minId) + minId)
  console.log(randomId)
  return randomId
}

app.post('/api/persons', (request, response) => {
  const body = request.body

  if (!body.name || !body.number) {
    return response.status(400).json({
      error: 'content missing'
    })
  }
  const nameExists = persons.find((person) => person.name === body.name)
  if (nameExists) {
    return response.status(400).json({
      error: "Name must be unique"
    })
  }

  const person = {
    name: body.name,
    number: body.number,
    id: generateRandomId()
  }

  persons = persons.concat(person)
  console.log(person)
  response.json(person)
})

app.delete('/api/persons/:id', (request, response) => {
  const id = Number(request.params.id)
  persons = persons.filter(person => person.id !== id)

  response.status(204).end()
})

morgan.token('postData', (request) => {
  if(request.method === 'POST') {
    return JSON.stringify(request.body)
  }
  return ''
})


const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`server running on port, ${PORT}`)
})
