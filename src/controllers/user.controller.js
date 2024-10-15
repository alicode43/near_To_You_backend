import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary } from "../utils/cloudinery.js";
import {ApiResponse}  from "../utils/ApiResponse.js";


const generateAccessTokenAndRefreshToken = async(userId)=>{
    
   try{

      const user=await User.findById(userId);
      const accessToken=user.generateAccessToken();
      const refreshToken=user.generateRefreshToken();
      user.refreshToken=refreshToken;
      await user.save({validateBeforeSave:false});
      return {accessToken,refreshToken};

      }catch(error){
         throw new ApiError(500,"Something went wrong while generating tokens")
      }
} 

const registerUser = asyncHandler(async (req, res) => {

    const {name, email,password}=req.body;
    console.log(name, email,password );

    if([name, email, password].some((field)=>{field?.trim()==="" }) ){
        throw new  ApiError(400,"All fields must be filled")
    }
    
    const isExist= await User.findOne({
        $or:[{email}]
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
      //   contactNo,
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


const logInUser= asyncHandler(async (req,res)=>{

      const {email, password,contactNo}=req.body;
      const user=await User.findOne({
         $or:[{email},{password}]
      });
      if(!user){
         throw new ApiError(404,"User not found");
      }
     const isPasswordValid=  await user.isPasswordCorrect(password);

     if(!isPasswordValid){
         throw new ApiError(401,"Password Incorrect");
      }
      const {refreshToken,accessToken}= await generateAccessTokenAndRefreshToken(user._id);
      const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

      const options = {
          httpOnly: true,
          secure: true
      }
  
      return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
          new ApiResponse(
              200 , 
              {
                  user: loggedInUser, accessToken, refreshToken
              },
              "User logged In Successfully"
          )
      )
  
  })

const logOutUser=asyncHandler(async (req, res) => {

   await User.findByIdAndUpdate(
      req.user._id,
      {
         $set:{
            refreshToken:undefined,
         }
      },
         {
            new:true,
         }
   );
   const options={
      httpOnly:true,
      secure:true,
   }
   
   return res
   .status(200)
   .clearCookie("accessToken",options)
   .clearCookie("refreshToken",options)
   .json(new ApiResponse(200,{},"User logged out successfully"))

    
})
export { 
   registerUser,
   logInUser,
   logOutUser
}

