require('dotenv').config()
const express = require('express')
const app = express()
const Person = require('./models/person')

app.use(express.json())

const morgan = require('morgan')
app.use(morgan('tiny', { stream: process.stdout }))
app.use(morgan(':method :url :status :response-time ms - :res[content-length] :postData', { stream: process.stdout }))

const cors = require('cors')
const person = require('./models/person')
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
  Person.find({}).then(persons => {
    response.json(persons)
  })

})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(personId => {
      if (personId) {
        response.json(personId)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

app.get('/info', async (request, response) => {

  try {
    const personsCount = await Person.countDocuments({})
    const currentDate = new Date()
    response.send(
      `<p>phonebook has info for ${personsCount} people
    <p>${currentDate}</p> 
    `)
    console.log(response)
  } catch(error) {
    response.status(500).send('Error fetching data')
  }
})

const generateRandomId = () => {
  const minId = 1
  const maxId = 99999

  const randomId = Math.floor(Math.random() * (maxId - minId) + minId)
  console.log(randomId)
  return randomId
}

app.post('/api/persons', (request, response, next) => {
  const body = request.body

  if (!body.name || !body.number) {
    return response.status(400).json({
      error: 'content missing'
    })
  }

  // check if the name already exists in the databse
  Person.findOne({ name: body.name })
    .then(existingPerson => {
      if (existingPerson) {
        return response.status(400).json({
          error: 'name must be unique'
        })
      }
      // create a new person using the person model
      const newPerson = new Person({
        name: body.name,
        number: body.number
      })
      // save the new person to the database
      newPerson.save()
        .then(savedPerson => {
          response.json(savedPerson)
        })
        .catch(error => next(error))
    })
    .catch(error => {
      response.status(500).json({
        error: 'error checking if the name exists'
      })
    })
})

app.delete('/api/persons/:id', (request, response) => {
  const id = (request.params.id)
  // use the Person model to find and delete the person by id
  Person.findByIdAndDelete(id)
    .then(deletedPerson => {
      if (deletedPerson) {
        console.log('deleted', deletedPerson)
        response.status(204).end()
      } else {
        console.log('person not found')
        response.status(404).json({ error: 'person not found' })
      }
    })
    .catch(error => {
      console.error('error deleting person', error)
      response.status(500).json({ error: 'error deleting the person' })
    })
})
app.put('/api/persons/:id', async (request, response, next) => {
  const body = request.body
  console.log('request body', body)

  const person = {
    name: body.name,
    number: body.number
  }

  try {
    const updatedPerson = await Person.findByIdAndUpdate(
      request.params.id,
      person,
      { new: true, runValidators: true, context: 'query'}
    );
    console.log('updated person', updatedPerson)

    if (!updatedPerson) {
      return response.status(404).json({ error: 'person not found' })
    }
    response.json(updatedPerson)
  } catch (error) {
    console.error('Error updating person:', error)
    next(error)
  }
})

morgan.token('postData', (request) => {
  if (request.method === 'POST') {
    return JSON.stringify(request.body)
  }
  return ''
})

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'MalformedId' })
  }
  next(error)
}

app.use(errorHandler)


const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`server running on port, ${PORT}`)
})

