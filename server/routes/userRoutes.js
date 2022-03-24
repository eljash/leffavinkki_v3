const express = require('express')
const router = express.Router()

router.get('/profile',(req,res) => {
    res.send('profile')
})

/*
        Polku rekisteröitymiseen.
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
    if(jsonObject.hasOwnProperty('email')){

    } else {
        //Virhe
    }
})

module.exports = router