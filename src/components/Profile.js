import React, {useEffect, useState} from 'react'
import axios from 'axios'
const profileURL = "http://localhost:4000/users/profile"

export default function Profile () {
    const urlParams = new URLSearchParams(window.location.search)

    const [userData, setUserData] = useState({})

    useEffect(async ()=>{
        let id;
        //Jos url ei sisällä id parametria, niin profiilia ei haeta
        if(!urlParams.has('id')){
            console.log('URL ei sisällä id parametria.')
            if(localStorage.getItem('userId') == null){
                console.log('Ei myöskään kirjautunutta käyttäjää. Profiilia ei haeta.')
                return
            }
            id = localStorage.getItem('userId')
        } else {
            id = urlParams.get('id')
        }
        //Jos id ei ole numeerinen, niin profiilia ei haeta
        if(isNaN(id)){
            console.log('URL:n id parametrin arvo ei ole numeerinen. Profiilia ei haeta.')
            return
        }

        console.log(id)

        try{
            await axios.get(profileURL, {
                headers: {
                    id: id
                }
            }).then(response => {
                console.log(response.data)
            })
        } catch (e) {

        }
    })

    return (
        <>
            <h1>Profile</h1>
        </>
    )
}