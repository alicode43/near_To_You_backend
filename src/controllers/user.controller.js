import { asyncHander } from "../utils/asyncHandler.js";

const registerUser = asyncHander(async (req, res) => {



    res.status(200).json({
         message: "Register gi user"
         });
})

export { registerUser}
