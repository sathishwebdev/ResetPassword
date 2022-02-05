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

// fPToken Generator

const fPTokenGenerator = async (data)=>{    
   const saltedKey = await bcrypt.genSalt(10)
   const hashedKey = await bcrypt.hash(`${data.email}${data.username}${data.password}${'SECRET_FPT_KEY'}`, saltedKey)
   return hashedKey
}

const RegisterRequest = async (data) =>{
    let register = await client
    .db("users")
    .collection("requests")
    .insertOne({to : data.email, verify: false, type:'FCP', for: data.username, id: 0})

    return register
}


// forget password

const forgetPassword = async (data) =>{
    let FPTKey = await fPTokenGenerator(data)
    let update = await client
    .db("users")
    .collection("creds")
    .updateOne({username : data}, {$set : {FPT : FPTKey }})

    return FPTKey
}

// change password

const changePassword = (data) =>{

}

export {
    keyGenerator,
    getUserByName,
    getSignup,
    forgetPassword,
    RegisterRequest
}