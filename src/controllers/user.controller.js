import { asyncHander } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary } from "../utils/cloudinery.js";
import {ApiResponse}  from "../utils/ApiResponse.js";


const registerUser = asyncHander(async (req, res) => {

    const {name, email,password,contactNo}=req.body;
    console.log(name, email,password );

    if([name, email, password,contactNo].some((field)=>{field?.trim()==="" }) ){
        throw new  ApiError(400,"All fields must be filled")
    }
    
    const isExist= await User.findOne({
        $or:[{email}, {contactNo}]
    })


    if(isExist){
        throw new ApiError(409,"User already exists");
    }

    // this for image handling only

    // const avatarLocalPath=req.files?.avatar[0]?.path;
    // if(!avatarLocalPath){
    //     throw new ApiError(400,"avatar is required");
    // }
     
    // const avatar= await uploadOnCloudinary(avatarLocalPath)


     const user=await User.create({
        name,
        email,
    
        password,
        contactNo,
        // avatar:avatar.url
     })

     const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
     )
     if(!createdUser){
        throw new ApiError(500,"User not created");
     }

     return res.status(201).json(
        new ApiResponse(201,createdUser,"User created successfully")
     )
   

})

export { registerUser}
