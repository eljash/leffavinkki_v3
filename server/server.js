const express = require('express')
const app = express();
const cors = require('cors')

const hostname = 'localhost';
const port = 4000;

//Suoritetaan alustukset
const initializations = require('./initializations')
initializations.initialize()

app.use(cors())

//Käyttäjätietoihin suunnatut reitit
const users = require('./routes/users')
//Elokuviin suunnatut reitit
const movies = require('./routes/movies')

app.use('/users',users)
app.use('/movies',movies)

app.get('/', (req,res)=>{
    res.send('LeffaVinkki palvelin');
})

app.listen(port, function() {
    console.log('Palvelin pyörii osoitteessa: http://'+hostname+":"+port)
})