import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

// steps for Registering user
// 1. get user details from frontend
// 2. validate all the details are properly fetched or Not
// 3. check if user already exists
// 4. upload files on cloudinary successfully
// 5. create user object and create entry on 
// 6. check for user creation 

const registerUser = asyncHandler(async (req, res) => {
    const { username, fullName, email, password } = req.body;
    console.log(email, password);
    // validation
    if (
        [username, fullName, email, password].some((feild) => feild==="")
    ) {
        throw new ApiError(400,"All feilds are required")
    }
    // check if user already exists
    if (await User.findOne({ email })) {
        throw new ApiError(409,"User with this email is  Already exists")
    }

    // console.log(req.files)

    const avatarLocalPath= req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError (400,"avatar file is required")
    }
    // upload files on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar) {
        throw new ApiError(400,"avatar file is required")
    }

    const user=await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username,
        
    })

    // for checking the user is created or not

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "something went wrong while registering the user");
    }

    // for providing response

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered Successfully")
    )


})


export {registerUser}