const express = require('express')
const router = express.Router()
const connection = require('../mysql')
const jwt = require('jsonwebtoken')
const bodyParser = require('body-parser')
const util = require('util')
const dotenv = require('dotenv')
const query = util.promisify(connection.query).bind(connection)

const jwtAuth = require('../jsonwebtoken')

router.use(bodyParser.urlencoded({extended: false}))
router.use(bodyParser.json('application/json'))

dotenv.config()

const tSecret = process.env.TOKEN_SECRET
const omdbMovies = process.env.OMDB_MOVIES_AS_JSON
const omdbApiKey = process.env.OMDB_KEY

//omdbMovies + parametri + & + parametri ... + omdbApiKey

module.exports = router