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

// create user   

const getSignup = async (data)=>{
    
    let responce = await client
    .db("users")
    .collection("creds")
    .insertOne(data)

    return {data,responce }
}
export {
    keyGenerator,
    getUserByName,
    getSignup
}