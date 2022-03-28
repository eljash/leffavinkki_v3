import React, {useEffect, useState} from 'react'

export default function Profile () {
    const urlParams = new URLSearchParams(window.location.search)
    if(urlParams.has('id'))
        console.log(urlParams.get('id'))

    const [userData, setUserData] = useState({})

    return (
        <>
            <h1>Profile</h1>
        </>
    )
}