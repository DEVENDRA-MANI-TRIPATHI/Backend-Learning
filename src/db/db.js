import mongoose from "mongoose";    
import { DB_NAME } from "../constants.js"


const connectDB = async () => {   // async bcs batabase is in other continent
    
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(` mongoDB connected at host name: ${connectionInstance.connection.host}`)

    } catch (error) {
        console.log("Database connection error", error);
    }
    
}

export default connectDB;