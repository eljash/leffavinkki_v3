const express = require('express')
const app = express();

const hostname = 'localhost';
const port = 4000;

//Käyttäjätietoihin suunnatut reitit
const users = require('./routes/userRoutes')

app.use('/users',users)

app.get('/', (req,res)=>{
    res.send('LeffaVinkki palvelin');
})

app.listen(port, function() {
    console.log('Palvelin pyörii osoitteessa: http://'+hostname+":"+port)
})