const dotenv = require('dotenv')
const jwt = require('jsonwebtoken')
const logs = require('./logFunctions')

dotenv.config()

const tSecret = process.env.TOKEN_SECRET

/*
        Funktio käyttöoikeustunnuksen luomiseen
 */
function generateAccessToken(email, username, id){
    //Tehdään logi kirjautumisesta
    logs.login(id)
    return jwt.sign({user_email: email, username: username, user_id:id}, tSecret, {expiresIn: '2d'})
}

/*
        Middleware käyttöoikeustunnuksen varmentamiseen
 */
function authenticateToken(req, res, next){
    try{
        const tokenToVerify = req.headers['accessToken']
        try{
            jwt.verify(tokenToVerify, tSecret, function(err,decoded) {
                //Lisätään käyttöoikeustunnuksesta käyttäjän sposti ja id pyyntöön
                req.user_email = decoded.user_email
                req.username = decoded.username
                req.user_id = decoded.user_id
            })
        } catch (e) {
            res.status(401).send('Käyttöoikeustunnus viallinen tai ei ole voimassa.')
            return
        }
        next()
    } catch (e) {
        res.status(500).send('Jokin meni vikaan.')
        return
    }
}

module.exports = {
    authenticateToken,
    generateAccessToken
}