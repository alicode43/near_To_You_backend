import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,

      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    contactNo: {
      type: Number,
      // required: true,
    },
    role:{
      type:String,
      enum: ['user', 'admin', 'provider'],
      default: 'user',

    },
    isVerify:{
      type:Boolean,
      default: false,
    },

    orderHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Booking",
      },
    ],
    avatar: {
      type: String,

    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
    googleId:{
      type:String,
      unique: true
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpire: {
      type: Date,
    },
    
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  console.log("pre save");
  if (this.isModified("password")) {
    console.log("password updated");

    try {

      this.password = await bcrypt.hash(this.password, 10);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return bcrypt.compare(password, this.password);
};
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPRIRY,
    }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPRIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);
