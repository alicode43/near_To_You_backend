import { asyncHander } from "../utils/asyncHandler.js";

const registerUser = asyncHander(async (req, res) => {

    const {fullName, email, username,password}=req.body;
    console.log(fullName, email, username,password );

    res.status(200).json({
         message: "Register gi user"
         });
})

export { registerUser}
