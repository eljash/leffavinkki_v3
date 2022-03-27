const fs = require('fs')

const dFunc = require('./dateFunctions')

function login(id){
    const loginLog = dFunc.getCurrentTimeString() + ' - LOGIN BY USER ID ' + id+"\n"
    fs.writeFile('./logs/logins.log', loginLog, {flag: 'a+'}, err => {
        if(err) {
            console.log(err)
        }
    })
}

module.exports = {
    login
}