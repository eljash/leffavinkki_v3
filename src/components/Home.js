import React, {useState, useEffect} from 'react'
import axios from 'axios'

const loginUrl = "http://localhost:4000/users/login"

export default function Home () {

    const handleSubmit = async(event) => {
        event.preventDefault()
        event.stopPropagation()

        const form = event.currentTarget

        try {
            await axios.get(loginUrl, {
                headers: {
                    email: form.emailfield.value,
                    password: form.passwordfield.value
                }
            }).then(response => {
                console.log(response.data)
                if(response.status === 200){
                    localStorage.setItem('accessToken', response.data.accessToken)
                    localStorage.setItem('userId', response.data.userId)
                }
            })
        } catch (e) {

        }
    }

    return (
        <>
            <h1>Home</h1>
            <form id="login-form" onSubmit={handleSubmit}>
                <input id="emailfield" type="email" required/>
                <input id="passwordfield" type="password" required/>
                <input type="submit"/>
            </form>
        </>
    )
}