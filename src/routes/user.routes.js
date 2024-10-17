import express, { Router } from "express";
import { registerUser,logInUser,logOutUser, refreshAccesToken,verifyUser,getUserProfile } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";

// import {} from "../controllers/user.controller.js"
const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        }
    ]),
    registerUser
);
router.route("/login").post(logInUser);
router.route("/verify-register").post(verifyUser);

router.route("/logout").post(verifyJWT, logOutUser);
router.route("/get-user-profile").get(verifyJWT, getUserProfile);
router.route("/refresh-token").post(refreshAccesToken);


export default router;
