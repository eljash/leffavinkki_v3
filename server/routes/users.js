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

router.get('/profile',(req,res) => {
    res.send('profile')
})

/*
        KOMMENTIN POISTO
            Pyynnön täytyy sisältää header access-token

            Rungon (body) täytyy sisältää JSON objekti avaimella commentId
 */
router.delete('/remove-comment', jwtAuth.authenticateToken, (req,res)=>{
    try {
        const jsonObject = req.body
        if(!jsonObject.hasOwnProperty('commentId')){
            res.status(400).send('Kommentin poisto pyynnöstä puuttuu kommentin id.')
            return
        }
        (async () => {
            const sql = "DELETE FROM commentprofile WHERE commentId = ? AND (commenterId = ? OR userId = ?)"
            const rows = await query(sql, [jsonObject.commentId, req.user_id, req.user_id])
            if(rows.affectedRows > 0) {
                res.status(200).send('Kommentti poistettu.')
                return
            }
            res.status(400).send('Kommenttia ei löytynyt tai sen poistamiseen ei ole oikeuksia.')
            return
        })()
    } catch (e) {
        res.status(500).send('Jokin meni vikaan.')
    }
})

/*
        KÄYTTÄJÄN PROFIILIN KOMMENTOINTI
            Pyynnön headerin täytyy sisältää header access-token <-- kuka kirjoittaa kommentin ja onko valtuudet

            Pyynnön täytyy sisältää rungossa (body) JSON objekti, jossa ainakin avaimet:
                userId <-- kenen profiiliin kirjoitetaan
                content <-- kommentin sisältö
              Vapaaehtoinen avain
                parentId <-- liittyykö kommenti jo aikasempaan kommenttiin
 */
router.post('/comment-profile', jwtAuth.authenticateToken, (req,res) => {
    try {
        const jsonObject = req.body
        //Jos jokin pakollinen avain puuttuu, lopetataan läpikäynti
        if(!jsonObject.hasOwnProperty('userId') || !jsonObject.hasOwnProperty('content')){
            res.status(400).send('Pyyntö kommentin jättämiseen ei sisällä kaikkia tarvittavia tietoja.')
            return
        }
        ( async() => {
            const writerId = req.user_id
            const recieverId = jsonObject.userId
            const content = jsonObject.content

            //Kommentoidaanko aikaisempaa kommenttia
            if(jsonObject.hasOwnProperty('parentId')){
                const sql = "INSERT INTO commentprofile (parentId, content, userId, commenterId) VALUES(?,?,?,?)"
                await query(sql, [jsonObject.parentId, content, recieverId, writerId])
                res.status(200).send('Kommentti lisätty.')
                return
            }
            const sql = "INSERT INTO commentprofile (content, userId, commenterId) VALUES(?,?,?)"
            await query(sql, [content, recieverId, writerId])
            res.status(200).send('Kommentti lisätty.')
            return
        })()
    } catch (e) {
        res.status(500).send("Jokin meni vikaan.")
        return
    }
})

/*
        PROFIILIN PÄIVITTÄMINEN
            Pyynnön headersien täytyy sisältää header 'access-token', joka sisältää käyttäjän voimassa olevan käyttöoikeustunnuksen

            Pyynnön runko (body) täytyy sisältää JSON objekti vähintään yhdellä näistä avaimista:
                description
                firstname
                lastname
 */
router.put('/update-profile', jwtAuth.authenticateToken, (req,res) => {

    //Middlewaresta authenticateToken saadaan req.user_email ja req.user_id <-- kirjautuneen käyttäjän sposti ja id

    try {
        const jsonObject = req.body

        //Pyynnön tulee sisältää väh. yksi avaimista
        if(jsonObject.hasOwnProperty('description') || jsonObject.hasOwnProperty('firstname') || jsonObject.hasOwnProperty('lastname')){
            (async () => {
                try{
                    let sql = "SELECT * FROM userprofile WHERE userId = ?"
                    const rows = await query(sql, [req.user_id])
                    if(rows.length > 0){
                        let description = rows[0].description
                        let firstname = rows[0].firstname
                        let lastname = rows[0].lastname
                        if(jsonObject.hasOwnProperty('description'))
                            description = jsonObject.description
                        if(jsonObject.hasOwnProperty('firstname'))
                            firstname = jsonObject.firstname
                        if(jsonObject.hasOwnProperty('lastname'))
                            lastname = jsonObject.lastname
                        sql = "UPDATE userprofile SET description = ?, firstname = ?, lastname = ? "+
                            "WHERE userId = ?"
                        await query(sql, [description, firstname, lastname, req.user_id])
                        res.status(200).send("Profiilin päivitys onnistui")
                        return
                    }
                    res.status(400).send('Käyttäjällesi ei löytynyt profiilia. Ota yhteys LeffaVinkin asiakaspalveluun.')
                    return
                } catch (e) {
                    res.status(500).send('Jokin meni vikaan.')
                    return
                }

            })()

        } else {
            res.status(500).send('Profiilin päivittäminen epäonnistui.')
            return
        }
    } catch (e) {
        res.status(500).send('Jokin meni vikaan.')
    }
})

/*
        KIRJAUTUMINEN
        Kutsun rungon täytyy sisältää JSON-objekti avaimilla:
                -email
                -password

        Onnistunut kirjautuminen palauttaa JSON objektin, jossa on avain accessToken,
        joka sisältää käyttöoikeustunnuksen
 */
router.get('/login', (req,res) => {
    try {
        const jsonObject = req.body

        if(jsonObject.hasOwnProperty('email') && jsonObject.hasOwnProperty('password')){
            const email = jsonObject.email;
            const password = jsonObject.password;
            (async () => {
                const sql = "SELECT userId FROM user WHERE email = ? AND password = SHA1(?)"
                const rows = await query(sql, [email, password])
                if(rows.length > 0){
                    const userId = rows[0].userId
                    //const token = jwt.sign({user_email: email, user_id:userId}, tSecret, { expiresIn: '2d'})
                    const token = jwtAuth.generateAccessToken(email, userId)
                    res.status(200).json({
                        accessToken: token
                    }).send();
                    return
                }

                res.status(400).send('Sähköposti tai salasana väärin')

            })()
        } else {
            res.status(400).send('Puutteelliset tiedot kirjautumista varten')
        }
    } catch (e) {

    }
})

/*
        REKISTERÖITYMINEN.
        Kutsun rungon täytyy sisältää JSON-objekti avaimilla:
                -email
                -password
                -username
        Vaihtoehtoisia avaimia:
                -firstname
                -lastname
 */
router.post('/register', (req,res) => {
    try{
        const jsonObject = req.body
        const required = ["email","password","username"]

        let requiredCount = 0

        //Katsotaan, että kutsun rungosta löytyy kaikki tarvittavat avaimet
        required.forEach(f => {
            if(jsonObject.hasOwnProperty(f))
                requiredCount++
        })

        if(requiredCount == required.length){
            const email = jsonObject.email
            const password = jsonObject.password
            const username = jsonObject.username
            //Katsotaan onko nimi/sposti käytössä
            let sql = 'SELECT * FROM user WHERE username = ? OR email = ?';

            (async () => {
                try {
                    let rows = await query(sql, [username, email])
                    if(rows.length > 0){
                        //Käyttäjä on jo olemassa
                        res.status(400).send("Käyttäjänimi tai sähköposti on jo käytössä");
                        return
                    }

                    sql = "INSERT INTO user (email, password, username) "
                        + "VALUES (?, SHA1(?), ?)"
                    rows = await query(sql, [email, password, username])

                    const createdUserId = rows.insertId;

                    let firstname = null
                    let lastname = null

                    if(jsonObject.hasOwnProperty('firstname'))
                        firstname = jsonObject.firstname
                    if(jsonObject.hasOwnProperty('lastname'))
                        lastname = jsonObject.lastname

                    sql = "INSERT INTO userprofile (userId, firstname, lastname) "
                        + "VALUES(?,?,?)"
                    await query(sql, [createdUserId, firstname, lastname])
                    res.status(200).send("Rekisteröityminen onnistui");

                } catch (err){
                    console.log(err)
                    res.status(400).send("Jokin meni vikaan rekisteröinnissä.");
                }

            })()

        } else {
            res.status(400).send("Jokin meni vikaan rekisteröinnissä.");
        }
    } catch (e) {

    }
})

module.exports = router