import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinery.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { Resend } from "resend";
import { Verify } from "../models/verifyModel.model.js";

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
  const { name, email, password } = req.body;
  console.log(name, email, password);

  if (
    [name, email, password].some((field) => {
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
  const resend = new Resend(process.env.RESEND_API_KEY);
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const htmlContent = `<strong>Your OTP code is ${otp}</strong>`;

  const { data, error } = await resend.emails.send({
    from: "Acme <onboarding@resend.dev>",
    to: email,
    subject: "Verify Your Account",
    html: htmlContent,
  });

  const verify = await Verify.create({
    otp,
    email,
    isConsumed: false,
  });
  if (!verify) {
    throw new ApiError(500, "Otp not created");
  }

  const user = await User.create({
    name,
    email,

    password,

    //   contactNo,
    // avatar:avatar.url
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
  if (
    [otp, email].some((field) => {
      field?.trim() === "";
    })
  ) {
    throw new ApiError(400, "All fields must be filled");
  }
  const verify = await Verify.findOne({
    email,
  });

  if (!verify) {
    throw new ApiError(404, "Email not found");
  }
  if(verify.isConsumed){
   throw new ApiError(400, "Otp is already used");
}

  const isOtpCorrect = await verify.isOTPCorrect(otp);
  const isExpired = await verify.isExpired();
   const date=new Date(Date.now());
//   console.log(date, Date.now())
//   console.log(isOtpCorrect, verify.otp, verify.expriryTime, Date.now()  );

 
   if (otp != verify.otp) {
    throw new ApiError(400, "Otp is incorrect");
  } else if (isExpired) {
    throw new ApiError(400, "Otp is expired");
  }
  verify.isConsumed = true;
verify.save();
  
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

export {
  registerUser,
  logInUser,
  logOutUser,
  refreshAccesToken,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  verifyUser,
};
