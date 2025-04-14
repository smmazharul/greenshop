import mongoose from "mongoose";

const conncetDB =async()=>{
    try {
        mongoose.connect.on('connected',()=>console.log("Database Connected")
        );
        await mongoose.connect(`${process.env.MONGODB_URI}/greenshop`)

    } catch (error) {
        console.log(error,message);
    }
}