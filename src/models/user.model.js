import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const userSchema = new Schema(
    {
        name:{
            type:String,
            required:true,
          
            trim:true,
             
        }, 
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true,
        },
         contactNo: {
            type: Number,
            // required: true,
          },
        orderHistory:[{
            type:Schema.Types.ObjectId,
            ref:"Booking"
        }],
        avatar:{
            type:String,
            // required:true, 
        },
        password:{
            type:String,
            required:[true, "Password is required"],
        }, 
        refreshToken:{
            type:String,
        }, 
    },
    {timestamps:true}
);

userSchema.pre("save",async function(next){
    if( this.isModified("password")){

        this.password=await bcrypt.hash(this.password,10)
        next();
    }
})

userSchema.methods.isPasswordCorrect= async function(password){
    return bcrypt.compare(password,this.password);
}
userSchema.methods.generateAccessToken=function(){
    jwt.sign({
        _id:this._id,
        email:this.email,
        name:this.name,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPRIRY,
    })
}
userSchema.methods.generateRefressToken=function(){
    jwt.sign({
        _id:this._id,
     
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPRIRY,
    })
}

export const User = mongoose.model("User", userSchema);
