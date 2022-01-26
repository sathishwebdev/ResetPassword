import bcrypt from 'bcrypt'
import {client} from './index.js'
import dotenv from 'dotenv'
dotenv.config()
const keyGenerator = async (password)=>{    
    // salting   
   const saltedKey = await bcrypt.genSalt(10)
   //  hash the saltedKey
   const hashedKey = await bcrypt.hash(password, saltedKey)
   return hashedKey
}

const getUserByName = async (name) => await client.db("users").collection("creds").findOne({username: name})


const updateDataInMail =async (data) => {
    let responce = await client
    .db("users")
    .collection("mail")
    .findOne({mailId : data.email})

    let update = await client
    .db("users")
    .collection("mail")
    .updateOne({mailId : data.email}, {$set : {usernames : [...responce.usernames, data.username]}})

}



// create user   

const getSignup = async (data)=>{
    
    let responce = await client
    .db("users")
    .collection("creds")
    .insertOne(data)

    let isNewMailId = await client
    .db("users")
    .collection("mail").findOne({mailId : data.email})

    !isNewMailId ? await client
    .db("users")
    .collection("mail")
    .insertOne({mailId : data.email, usernames : [data.username], DetailsOfIds : [data]}) :
    updateDataInMail(data)
    
    return {data,responce }
}



export {
    keyGenerator,
    getUserByName,
    getSignup
}