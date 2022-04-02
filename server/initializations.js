const fs = require('fs')

exports.initialize = function(){
    //Luodaan kansio käyttäjien julkaisuja varten, jos sitä ei ole
    const uploadsDir = './uploads'
    if(!fs.existsSync(uploadsDir))
        fs.mkdirSync(uploadsDir)
}
