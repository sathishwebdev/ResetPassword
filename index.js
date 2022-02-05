import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { MongoClient } from 'mongodb';
import { ObjectId } from 'bson';
import nodemailer from 'nodemailer'
import {getSignup, keyGenerator, getUserByName, forgetPassword, RegisterRequest} from './helper.js'
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express()
dotenv.config()
app.use(cors())
app.use(express.json())
const PORT = process.env.PORT || 9000
const MONGO_URL = process.env.DB_URL

const createConnection = async () => {
    const client = new MongoClient(MONGO_URL);
    await client.connect()
    console.log("I got the Database, Boss.")
    return client
    }

export const client = await createConnection()

app.post('/signup', async (req, res)=>{
    let data = req.body
    const hashWord = await keyGenerator(data.password) 
    //  check user avalaiblity
    let checkUserAvailability = await getUserByName(data.username)
    
    // check password strength 
    let passwordStrength = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&_])[A-Za-z\d@$!%*#?&_]{6,}$/.test(`${data.password}`)

    // check username
    let usernameStrength = /^[A-Za-z\d_]{4,}$/.test(`${data.username}`)

    // conditional statements
    if(checkUserAvailability){
        res.status(400).send({result:false, message : "Username Already Exist - Better Luck Next Time 😈"})
    }else if (!passwordStrength){
        res.status(400).send({result:false, message : `Password must be longer \n \t - Atleast 6 characters \n \t - Atleast one letter \n \t - Atleast one number \n \t - Atleast one special characters `})
    }else if (!usernameStrength){
        res.status(400).send({result:false, message : `Username should be min 3 characters - Only letters, numbers and _ can be accepteable`})
    }
    else{
        data.password =  hashWord
        let dbResponce = await getSignup(data)
        res.status(200).send({result : true, response: dbResponce, mail: true})
    }
               
})

app.post('/login', async (req,res)=>{
    const {username, password} = req.body ;

    // check user 

    const getUser = await getUserByName(username)
    
    if(!getUser){
        res.status(401).send({message: "Invalid Credentials 💔", result: false})
    }else if(getUser){
    //  check credentails
    const checkCred = await bcrypt.compare(password, getUser.password )

    if (checkCred){
        // token creation
        const token =  jwt.sign(getUser._id.toJSON(), "SKWONIEARN")
        res.send({message: 'Log in Successfull 🤗', apiKey : token, result: true, response: getUser})
    } else if(!checkCred) {
        res.send({message:'Invalid Credentials 💔'})
    }
}
})

app.get('/users', async (req, res)=>{
    let users = await client.db("users").collection("creds").find({}).toArray()

    res.send({data : users,numOfUsers: users.length, result : true})
})

app.get('/user/:username', async (req, res)=>{

    let users = await client.db("users").collection("creds").findOne({username : req.params.username})
!users ? 
    res.send({data : users, result : false})
:
    res.send({data : users, result : true})
})

// get request

app.get('/request/:requestId', async (req, res)=>{

    let getLog = await client.db("users").collection("requests").findOne({_id : ObjectId(req.params.requestId)})
if(!getLog){
    res.send({data : getLog, result : false})
}else{
    let makeVerify = await client
    .db("users")
    .collection("requests")
    .updateOne({_id : ObjectId(req.params.requestId)}, {$set : {verify : req.query.verify === 'true' ? true : false}})

    res.send({data : getLog, result : true})
}
    
})

app.get('/', (req, res)=>{
res.send('hello')
})

app.post('/forgetpassword',async (req,res)=>{
    let {username} = req.body

    
    const getUser = await getUserByName(username)

    if(!getUser){
        res.status(401).send({message: "Invalid user 💔", result: false})
    }else if(getUser){
        let FPToken = await forgetPassword(username)
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth:{
                user : process.env.MAIL,
                pass: process.env.MAIL_KEY,
                secure : true
            }
        })
    
        let details = {
            from : process.env.MAIL,
            to: getUser.email,
            subject : "Change Your Password | Secuirity | SK ",
            html : `<div class="text-center">
                <h1>Change Your Password</h1><small>${getUser.username}</small><br/><p>test mail</p><a class="btn btn-primary" href="https://auth-template-sk.netlify.app/${getUser.username}/forgetpassword/k/?key=${FPToken}" target='_blank' >Click here to change Password</a>
            </div>` 
        }
    
         transporter.sendMail(details, async (err)=>{
            if(err) {
                res.status(400).send({result:false, message: err.message, mail: false})
            }
            else {           
                 let registeration = await RegisterRequest(getUser)
                res.status(200).send({result : true,message:`Request send to ${getUser.email}`, mail: true, registeration})
                }
       })
    }
})

//  verify and change password

app.post('/changepassword/:userName', async (req, res)=>{
    let key = req.query.key
    let username = req.params.userName
    let {password} = req.body
    let users = await client.db("users").collection("creds").findOne({username : username})

    if(users.FPT === key){
    
        
        // check password strength 
    let passwordStrength = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&_])[A-Za-z\d@$!%*#?&_]{6,}$/.test(`${password}`)
    if (!passwordStrength){
        res.status(400).send({result:false, message : `Password must be longer \n \t - Atleast 6 characters \n \t - Atleast one letter \n \t - Atleast one number \n \t - Atleast one special characters `})
    }else{
        const hashWord = await keyGenerator(password) 
        let update = await client
        .db("users")
        .collection("creds")
        .updateOne({username : username}, {$set : {password : hashWord }})
        await client.db("users").collection("creds").updateOne({username : username}, {$set:{FPT : null}})
        res.status(200).send({result : true, message:"successfully changed !", response: update, verify: true})
    }
        
    
    }else{
        res.send({result: false ,message : "error", verify: false, response: null})
    }
    
})


app.listen(PORT, ()=>{console.log('Server started at ' + PORT)})


