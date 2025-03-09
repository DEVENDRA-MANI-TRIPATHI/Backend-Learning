import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        index: true,
        trim:true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim:true
    },
    fullname: {
        type: String,
        required: true,
        index: true,
        trim:true
    },
    avatar: {
        type: String,  // cloudinary url
        required: true,
    },
    coverImage: {
        type: String,  // cloudinary url
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    password: {
        type: String,
        required:[true,"Password is required"]
    },
    refreshToken: {
        type:String,
    }
}, { timestamps: true });


userSchema.pre("save", async function (next) {
    if(!this.isModified("password"))return next()
    this.password = await bcrypt.hash(this.password, 8)
    next()
});

userSchema.methods.isPasswordCorrect=async function (password) {
    return await bcrypt.compare(password,this.password)
}

export const User = mongoose.model("User", userSchema);