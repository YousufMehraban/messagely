const express = require('express')
const router = new express.Router()
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const {SECRET_KEY} = require('../config')
const ExpressError = require('../expressError')

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post('/login', async (req, res, next)=>{
    try{
        const {username, password} = req.body
        if (await User.authenticate(username, password)){
            User.updateLoginTimestamp(username)
            const token = jwt.sign({username}, SECRET_KEY)
            return res.json({token})
        }
        throw new ExpressError('username/password is incorrect!', 400)

    }catch(e){
        return next(e)
    }
})


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post('/register', async (req, res, next)=>{
    try{
        const username = req.body.username
        const password = req.body.password
        const first_name = req.body.first_name
        const last_name = req.body.last_name
        const phone = req.body.phone
        await User.register({username, password, first_name, last_name, phone})
        // await User.register(req.body) // req.body is an object register method takes an obj of args
        const token = jwt.sign({username}, SECRET_KEY)
        User.updateLoginTimestamp(username)
        return res.json({token})
    }catch(e){
        return next(e)
    }
})


module.exports = router