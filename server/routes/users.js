const express = require('express')
const router = express.Router()
const connection = require('../mysql')
const jwt = require('jsonwebtoken')
const bodyParser = require('body-parser')
const util = require('util')
const dotenv = require('dotenv')
const multer = require('multer')
const path = require('path')
const query = util.promisify(connection.query).bind(connection)

const jwtAuth = require('../jsonwebtoken')

//Profiiliakuvia varten tarvittavat muuttujat
const avatarStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const location = './uploads/' + req.username
        cb(null, location)
    },
    filename: function (req, file, cb) {
        cb(null, 'avatar.png')
    }
})
const avatarUpload = multer({
    storage: avatarStorage,
    fileFilter: function (req, file, callback) {
        const ext = file.originalname.slice(file.originalname.lastIndexOf("."))
        console.log(ext)
        if(ext !== ".png"){
            return callback(new Error('Vain .png päätteiset tiedostot sallittuja.'))
        }
        callback(null, true)
    }
})

router.use(bodyParser.urlencoded({extended: false}))
router.use(bodyParser.json('application/json'))

dotenv.config()

const tSecret = process.env.TOKEN_SECRET

/*
        KÄYTTÄJÄN TIEDOT PROFIILIA VARTEN
            -Headerin täytyy sisältää avain id

            -Kaikki userprofile taulusta
            -Käyttäjänimi user taulusta
 */
router.get('/profile',(req,res) => {
    (async () => {
        try{
            const jsonObject = req.headers
            console.log(jsonObject)
            if(!jsonObject.hasOwnProperty('id')){
                res.status(400).send('Pyynnön bodysta puuttuu id-avain')
                return
            }

            const idToSearch = jsonObject.id
            let sql = "SELECT username FROM user WHERE userId = ?"
            const rows = await query(sql,[idToSearch])
            if(rows<1){
                res.status(404).send('Käyttäjää ei löytynyt.')
                return
            }

            sql = "SELECT * FROM userprofile WHERE userId = ?"
            const rows2 = await query(sql,[idToSearch])
            if(rows2<1){
                res.status(404).send('Käyttäjää ei löytynyt.')
                return
            }

            let responseJson = {...rows[0],...rows2[0]}
            res.status(200).json(responseJson).send()
            return
        } catch (e) {
            console.log(e)
            res.status(500).send('Jotain meni vikaan.')
            return
        }
    })()
})

/*
        KAIKKI KÄYTTÄJÄT TIETOKANNASTA
 */
router.get('',(req,res)=>{
    (async () => {
        try{
            const sql = "SELECT * FROM userprofile"
            const rows = await query(sql)
            if(rows.length > 0){
                res.status(200).json(rows).send()
                return
            }
            res.status(500).send('Jokin meni vikaan.')
            return
        } catch (e) {
            res.status(500).send('Jokin meni vikaan.')
            return
        }})()
})

/*
        PROFIILIN HAKU NIMELLÄ
            -Rungon (body) täytyy sisältää avain nameToSearch
 */
router.get('/search',(req,res) => {
    const jsonObject = req.body;
    if(!jsonObject.hasOwnProperty('nameToSearch')){
        res.status(400).send('Hakun /body/ ei sisällä avainta "name".')
        return
    }
    const name = '%'+jsonObject.nameToSearch+'%';
    (async () => {
        try{
            let responseJson = {"profiles":[]}
            let sql = "SELECT userId FROM user WHERE username LIKE ?"
            let rows = await query(sql,[name])
            if(rows.length > 0){
                sql = "SELECT * FROM userprofile WHERE userId = ?"
                for(let i = 0; i < rows.length; i++){
                    const profile = await query(sql,[rows[i].userId])
                    if(profile.length>0)
                        responseJson.profiles.push(profile[0])
                }
            }
            sql = "SELECT * FROM userprofile WHERE firstname LIKE ? OR lastname LIKE ?"
            rows = await query(sql,[name, name])
            if(rows.length > 0){
                rows.forEach(row => {
                    responseJson.profiles.push(row)
                })
            }
            res.status(200).json(responseJson).send()
            return
        } catch (e) {
            console.log(e)
            res.status(500).send('Jokin meni vikaan.')
            return
        }
    })()
})

/*
        PROFIILIN ARVOSTELU
            Pyynnön täytyy sisältää header accessToken

            Rungon (body) täytyy sisältää avaimet:
                -profileId
                -review (Numeraalinen)

            Kaikki negatiiviset arvot muunnetaan -1, positiiviset 1 ja 0 = 0 eli neutraali arvostelu.
 */
router.post('/rate-profile', jwtAuth.authenticateToken, (req,res) => {
    try {
        const jsonObjet = req.body
        if(!jsonObjet.hasOwnProperty('profileId') || !jsonObjet.hasOwnProperty('review')){
            res.status(400).send('Pyynnöstä puuttuu avaimia.')
            return
        }
        if(isNaN(jsonObjet.profileId) || isNaN(jsonObjet.review)){
            res.status(400).send('Numeraalisten arvojen sijaan muita muuttuja arvoja.')
            return
        }
        if(jsonObjet.profileId == req.user_id){
            res.status(400).send('Käyttäjä ei voi arvioida omaa profiiliaan.')
            return
        }
        (async () => {
            try{

                const reviewer = req.user_id
                const profile = jsonObjet.profileId
                let review

                if(jsonObjet.review > 0)
                    review = 1
                else if(jsonObjet.review < 0)
                    review = -1
                else
                    review = 0

                let sql = "SELECT * FROM ratingprofile WHERE userId = ? AND raterId = ?"

                const rows = await query(sql, [profile,reviewer])
                if(rows.length > 0){
                    sql = "UPDATE ratingprofile SET rating = ? WHERE userId = ? AND raterId = ?"
                    await query(sql, [review, profile, reviewer])
                    res.status(200).send('Profiili arvostelu onnistui.')
                    return
                } else {
                    sql = "INSERT INTO ratingprofile (rating, userId, raterId) VALUES (?,?,?)"
                    await query(sql, [review, profile, reviewer])
                    res.status(200).send('Profiili arvostelu onnistui.')
                    return
                }

            } catch (e) {
                res.status(400).send('Jokin meni vikaan arvostelun tekemisessä.')
                return
            }
        })()
    } catch (e) {
        res.status(500).send('Jokin meni vikaan.')
        return
    }
})

/*
        KOMMENTIN POISTO
            Pyynnön täytyy sisältää header accessToken

            Rungon (body) täytyy sisältää JSON objekti avaimella commentId
 */
router.delete('/remove-comment', jwtAuth.authenticateToken, (req,res)=>{
    try {
        const jsonObject = req.body
        if(!jsonObject.hasOwnProperty('commentId')){
            res.status(400).send('Kommentin poisto pyynnöstä puuttuu kommentin id.')
            return
        }
        if(isNaN(jsonObject.commentId)){
            res.status(400).send('Kommentin id ei ole annettu numeraalina.')
            return
        }
        (async () => {
            try {
                const sql = "DELETE FROM commentprofile WHERE commentId = ? AND (commenterId = ? OR userId = ?)"
                const rows = await query(sql, [jsonObject.commentId, req.user_id, req.user_id])
                if(rows.affectedRows > 0) {
                    res.status(200).send('Kommentti poistettu.')
                    return
                }
                res.status(400).send('Kommenttia ei löytynyt tai sen poistamiseen ei ole oikeuksia.')
                return
            } catch (e) {
                res.status(400).send('Jokin meni vikaan kommenttia poistaessa.')
                return
            }
        })()
    } catch (e) {
        res.status(500).send('Jokin meni vikaan.')
    }
})

/*
        KÄYTTÄJÄN PROFIILIN KOMMENTOINTI
            Pyynnön headerin täytyy sisältää header accessToken <-- kuka kirjoittaa kommentin ja onko valtuudet

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
        if(isNaN(jsonObject.userId)){
            res.status(400).send('Kommentoitavan profiilin id ei ole annettu numeraalina.')
            return
        }
        ( async() => {
            try {
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
            } catch (e) {
                res.status(400).send('Kommentin jättäminen ei onnistunut. Joko käyttäjää ei löytynyt tai muu virhe.')
                return
            }
        })()
    } catch (e) {
        res.status(500).send("Jokin meni vikaan.")
        return
    }
})

/*
        PROFIILIN PÄIVITTÄMINEN
            Pyynnön headersien täytyy sisältää header 'accessToken', joka sisältää käyttäjän voimassa olevan käyttöoikeustunnuksen

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
        PROFIILIKUVAN LÄHETTÄMINEN
 */
router.post('/upload-avatar', jwtAuth.authenticateToken, avatarUpload.single('avatar'),(req,res) => {
    res.status(200).send('ok')
})

/*
        KIRJAUTUMINEN
        Headerin täytyy sisältää avaimet:
                -email
                -password

        Onnistunut kirjautuminen palauttaa JSON objektin, jossa on avain accessToken,
        joka sisältää käyttöoikeustunnuksen

        Palauttaa json:in sisällä:
            accessToken
            userId
 */
router.get('/login', (req,res) => {
    try {
        const jsonObject = req.headers

        if(jsonObject.hasOwnProperty('email') && jsonObject.hasOwnProperty('password')){
            const email = jsonObject.email;
            const password = jsonObject.password;
            (async () => {
                try {
                    const sql = "SELECT userId, username FROM user WHERE email = ? AND password = SHA1(?)"
                    const rows = await query(sql, [email, password])
                    if(rows.length > 0){
                        const userId = rows[0].userId
                        const username = rows[0].username
                        //const token = jwt.sign({user_email: email, user_id:userId}, tSecret, { expiresIn: '2d'})
                        const token = jwtAuth.generateAccessToken(email, username,userId)
                        res.status(200).json({
                            'userId' : userId,
                            'accessToken': token
                        }).send();
                        return
                    }
                    res.status(400).send('Sähköposti tai salasana väärin')
                    return
                } catch (e) {
                    res.status(400).send('Virhe kirjautumisessa')
                    return
                }
            })()
        } else {
            res.status(400).send('Puutteelliset tiedot kirjautumista varten')
            return
        }
    } catch (e) {
        res.status(500).send('Jotain meni vikaan.')
        return
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