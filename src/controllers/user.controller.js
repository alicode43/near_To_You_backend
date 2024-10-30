import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinery.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import axios from 'axios';

import otpVerify from "../utils/OTPverify.js";
import otpGenerate from "../utils/OTPGenerate.js";

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  console.log(name, email, password);

  if (
    [name, email, password, role].some((field) => {
      field?.trim() === "";
    })
  ) {
    throw new ApiError(400, "All fields must be filled");
  }

  const isExist = await User.findOne({
    $or: [{ email }],
  });

  if (isExist) {
    throw new ApiError(409, "User already exists");
  }

  // this for image handling only

  // const avatarLocalPath=req.files?.avatar[0]?.path;
  // if(!avatarLocalPath){
  //     throw new ApiError(400,"avatar is required");
  // }

  // const avatar= await uploadOnCloudinary(avatarLocalPath)

  const generateOTP = otpGenerate(email);

  const user = await User.create({
    name,
    email,

    password,
    role,

    //   contactNo,
    // avatar:avatar.url.
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "User not created");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User created successfully"));
});

const verifyUser = asyncHandler(async (req, res) => {
  const { otp, email } = req.body;
  const OTPverify = otpVerify(otp, email);

  if (!OTPverify) {
    throw new ApiError(400, "OTP not verified");
  }

  const user = await User.findOneAndUpdate(
    { email: email },
    {
      $set: {
        isVerify: true,
      },
    },

    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User verified successfully"));
});

const logInUser = asyncHandler(async (req, res) => {
  const { email, password, contactNo } = req.body;
  const user = await User.findOne({
    $or: [{ email }, { password }],
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);

  //   console.log("user is ",user);
  if (!isPasswordValid) {
    throw new ApiError(401, "Password Incorrect");
  }
  const { refreshToken, accessToken } =
    await generateAccessTokenAndRefreshToken(user._id);
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully"));
});

const refreshAccesToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorize Request : Token is required");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefereshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const isPasswordCorrect = await User.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Old password is incorrect");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated successfully"));
});
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, req.user, "current User fetched successfully");
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { name, email, contactNo } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        name,
        email,
        contactNo,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

const otpGenerator = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const otpGenerated = otpGenerate(email);
  if (!otpGenerated) {
    throw new ApiError(400, "OTP generation failed");
  }
  return res
    .status(200)
    .json(new ApiResponse(201, "", "OTP Generated successfully"));
});

const googleAuth = asyncHandler(async (req, res) => {
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const REDIRECT_URI =
    "https://near-to-you-backend.onrender.com/api/v1/users/google/callback";
  const FRONTEND_URL = "http://localhost:3000/dashboard";
  const scope = "profile email";
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${scope}`;
  res.redirect(authUrl);
});




const googleCallBack=asyncHandler( async (req, res) => {
  const { code } = req.query;

  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  // const REDIRECT_URI =
  //   "https://near-to-you-backend.onrender.com/api/v1/users/google/callback";
  const REDIRECT_URI =
    "http://localhost:3000/landing";
  const FRONTEND_URL = "http://localhost:3000";
  const scope = "profile email";

  try {
    // Exchange authorization code for access and id tokens
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    const { id_token, access_token } = tokenResponse.data;

    // Step 3: Get user info from Google with the access token
    const userResponse = await axios.get(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`, {
      headers: {
        Authorization: `Bearer ${id_token}`,
      },
    });

    const { id, email, picture, name } = userResponse.data;

    // Step 4: Save user to DB or update if already exists
    let user = await User.findOne({
      $or: [
        { googleId: id },
        { email: email }
      ]
    });

    if (!user) {
      user = new User({
        googleId: id,
        name: name,
        email,
        isVerify: true,
        avatar: picture,
      });
      await user.save({ validateBeforeSave: false });
    }

      const { refreshToken, accessToken } =
    await generateAccessTokenAndRefreshToken(user._id);
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken, 
          redirectUrl: FRONTEND_URL,
        },
        "User logged In Successfully"
      )
    )
    .redirect(FRONTEND_URL)
  } catch (error) {
    console.error(error);
    res.status(500).send('Authentication failed');
  }
});




const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const generateOTP = otpGenerate(email);
  if (!generateOTP) {
    throw new ApiError(500, "OTP generation failed");
  }
  const verifyOTP = otpVerify();
});

export {
  registerUser,
  logInUser,
  logOutUser,
  refreshAccesToken,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  verifyUser,
  getUserProfile,
  otpGenerator,
  googleAuth,
  googleCallBack,
};
