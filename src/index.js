import mongoose, { connect } from "mongoose";
import connectDB from "./db/index.js";
import dotenv from "dotenv"
import { app } from "./app.js";
dotenv.config({
    path:'./  env'
})
connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port ${process.env.PORT}  or 8000`)
    })

})
.catch((error) => {
    console.log("mongodb connection error", error);
    process.exit(1)
})
