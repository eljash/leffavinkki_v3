function getCurrentTimeString(){
    const dateNow = new Date()
    const year = dateNow.getFullYear()
    let month = dateNow.getMonth() + 1;
    let day = dateNow.getDate()

    let hours = dateNow.getHours()
    let minutes = dateNow.getMinutes()
    let seconds = dateNow.getSeconds()

    if(month < 10) month = '0' + month
    if(day < 10) day = '0' + day
    if(hours < 10) hours = '0' + hours
    if(minutes < 10) minutes = '0' + minutes
    if(seconds < 10) seconds = '0' + seconds


    return day + "." + month + "." + year + " : " + hours + "." + minutes + "." + seconds
}

module.exports = {
    getCurrentTimeString
}