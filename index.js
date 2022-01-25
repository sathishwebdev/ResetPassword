import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { MongoClient } from 'mongodb';
import nodemailer from 'nodemailer'
import {getSignup, keyGenerator, getUserByName} from './helper.js'

const app = express()
dotenv.config()
app.use(cors())
app.use(express.json())
const PORT = 9000 || process.env.PORT
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
    let passwordStrength = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/.test(`${data.password}`)

    // check username
    let usernameStrength = /^[A-Za-z\d_]{4,}$/.test(`${data.username}`)

    // conditional statements
    if(checkUserAvailability){
        res.send({message : "Username Already Exist - Better Luck Next Time 😈"})
    }else if (!passwordStrength){
        res.send({message : `Password must be longer \n \t - Atleast 6 characters \n \t - Atleast one letter \n \t - Atleast one number \n \t - Atleast one special characters `})
    }else if (!usernameStrength){
        res.send({message : `Username should be min 3 characters - Only letters, numbers and _ can be accepteable`})
    }
    else{
        data.password =  hashWord
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
            to: data.email,
            subject : "Verify Your Account | SK ",
            html : `<div class="text-center">
                <h1>Verify Your Account</h1><small>${data.username}</small><br/><p>test mail</p><button>Verify</button>
            </div>` 
        }
    
         transporter.sendMail(details, async (err)=>{
            if(err) {
                 console.log(Error, err)
                res.status(400).send({result:false, error: err.message, mail: false})
            }
            else {
                console.log('Mail sent')                
                let dbResponce = await getSignup(data)
                res.status(200).send({result : true, response: dbResponce, mail: true})
                }
            })
    
    }
})

app.get('/users', async (req, res)=>{
    let users = await client.db("users").collection("creds").find({}).toArray()

    res.send({users,numOfUsers: users.length, result : true})
})


app.listen(PORT, ()=>{console.log('Server started at ' + PORT)})


