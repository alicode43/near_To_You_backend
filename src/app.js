import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import http from 'http';
import setupSocketIO from './utils/socket.js';

const app = express();
const server = http.createServer(app);
const io = setupSocketIO(server);


app.use(cors(
   { origin:process.env.CORS_ORIGIN,
    Credentials:true
   }
) )

app.use(express.json({limit:'16kb'}))
app.use(express.urlencoded({extended:true, limit:'16kb'}))
app.use(express.static("public"))
app.use(cookieParser())

//Routes
import userRouter from "./routes/user.routes.js";
import messageRouter from "./routes/message.routes.js";
app.use("/api/v1/users",userRouter)
app.use("/api/v1/messages",messageRouter)


export {app, server}