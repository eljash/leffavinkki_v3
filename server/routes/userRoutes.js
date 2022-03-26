const express = require('express')
const router = express.Router()
const connection = require('../mysql')
const jwt = require('jsonwebtoken')
const bodyParser = require('body-parser')
const util = require('util')
const dotenv = require('dotenv')
const query = util.promisify(connection.query).bind(connection)

router.use(bodyParser.urlencoded({extended: false}))
router.use(bodyParser.json('application/json'))

dotenv.config()

const tSecret = process.env.TOKEN_SECRET

router.get('/profile',(req,res) => {
    res.send('profile')
})

/*
        KIRJAUTUMINEN
        Kutsun rungon täytyy sisältää JSON-objekti avaimilla:
                -email
                -password

        Onnistunut kirjautuminen palauttaa JSON objektin, jossa on avain accessToken,
        joka sisältää käyttöoikeustunnuksen
 */

router.post('/login', (req,res) => {
    const jsonObject = req.body

    if(jsonObject.hasOwnProperty('email') && jsonObject.hasOwnProperty('password')){
        const email = jsonObject.email;
        const password = jsonObject.password;
        (async () => {
            const sql = "SELECT userId FROM user WHERE email = ? AND password = SHA1(?)"
            const rows = await query(sql, [email, password])
            if(rows.length > 0){
                const userId = rows[0].userId
                const token = jwt.sign({user_email: email, user_id:userId}, tSecret, { expiresIn: '2d'})
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
                    res.status(400).send();
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
                res.status(200).send();

            } catch (err){
                console.log(err)
                res.status(400).send();
            }

        })()

        //SQL kutsu uuden käyttäjän tekemiseen. Jos ei onnistu niin palauta virhe

        //Luonnin yhteydessä luo tietokannan palauttama rivistö. Jos vapaaehtoisia kenttiä lähetetty
        //lähetä arvot käyttäjän profiilitauluun

    } else {
        res.status(400).send();
    }
})

module.exports = router