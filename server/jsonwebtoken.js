const dotenv = require('dotenv')
const jwt = require('jsonwebtoken')
const logs = require('./logFunctions')

dotenv.config()

const tSecret = process.env.TOKEN_SECRET

function generateAccessToken(email, id){
    //Tehdään logi kirjautumisesta
    logs.login(id)
    return jwt.sign({user_email: email, user_id:id}, tSecret, {expiresIn: '2d'})
}

function authenticateToken(req, res, next){
    const tokenToVerify = req.headers['access-token']
    try{
        jwt.verify(tokenToVerify, tSecret, function(err,decoded) {
            console.log(decoded.user_email + " : " + decoded.user_id)

        })
    } catch (e) {
        res.status(401).send('Käyttöoikeustunnus viallinen tai ei ole voimassa.')
    }

    next()
}

module.exports = {
    authenticateToken,
    generateAccessToken
}