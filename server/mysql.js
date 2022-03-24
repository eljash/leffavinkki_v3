const mysql = require('mysql')
const dotenv = require('dotenv')

dotenv.config()

const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_UN,
    password: process.env.MYSQL_PWRD,
    database: process.env.MYSQL_DB
})

connection.connect(function(err){
    if(err)throw err
    console.log('Tietokanta yhteys osoitteesta: '+process.env.MYSQL_HOST)
})

module.exports = connection