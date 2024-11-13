// routes/messageRoutes.js
import { Router } from "express";
import { sendMessage, getMessages,test } from '../controllers/message.controller.js';
import {verifyJWT} from "../middlewares/auth.middleware.js";


const messageRouter = Router();

// router.post('/send', verifyJWT, sendMessage);
// router.get('/:userId', verifyJWT, getMessages);
messageRouter.route('/test').get(test);
messageRouter.route('/test').post(test);

messageRouter.route('/send').post( verifyJWT, sendMessage);

messageRouter.route('/:receiverId').get( verifyJWT,getMessages);


export default messageRouter;
