const dotenv = require('dotenv')
const jwt = require('jsonwebtoken')

dotenv.config()

const tSecret = process.env.TOKEN_SECRET

export function generateAccessToken(id){
    return jwt.sign(id, tSecret, {expiresIn: '2d'})
}