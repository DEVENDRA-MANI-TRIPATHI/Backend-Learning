import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

// for generation Refresh and Access Token
const generateAccessAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId);
        const accessToken =await user.generateAccessToken();
        const refreshToken =await user.generateRefreshToken();

        user.refreshToken  = refreshToken
        await user.save({ validateBeforeSave: false })
        
        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500, "something went wrong while generation Access and Refresh Token");
    }
}

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


// Login User
// 1. get details of the user from body
// 2. check if user exist
// 3. validate password
// 4. generate Access token and refresh Token and return the response

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new ApiError(400, "email and password is required");
    }
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(400, "user with this email does not exist");
    }

    console.log(user)

    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(400,"incorrect password")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
    
    console.log(accessToken);
    console.log(refreshToken);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // console.log(accessToken)

    const options = {
        httpOnly: true,
        secure:true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "user Logged in Successfully"
            )
        )

})

const logOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new:true
        }
    )
    
    const options = {
        httpOnly: true,
        secure:true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200,{},"User LoggedOut Successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken //for mobile application if there sending refresh token in body
    if (!incommingRefreshToken) {
        throw new ApiError(401,"unauthorized request")
    }
    try {
        const decodedToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
        const user = User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401,"Invalid Rfresh Token")
        }
    
        if (incommingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401,"Refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure:true
        }
    
        const {accessToken,newrefreshToken}= await generateAccessAndRefreshToken(user._id)
        
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newrefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newrefreshToken },
                    "Access Token Refreshed"
                )
            )
    } catch (error) {
       throw new ApiError(401,error?.message) 
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldpassword, newpassword } = req.body;
    const user = findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldpassword);
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password");
    }
    user.password = newpassword
    await user.save({ validateBeforeSave })
    
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password changed Successfully"
            )
        )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res 
        .status(200)
        .json(
            new ApiResponse(
                200,
                req.user,
                "Current user Fetched Successfully"
            )
        )
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;
    if (!fullName || !email) {
        throw new ApiError(400, "All fields are Required");
    }
    const user= User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {new:true}
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "userDetails updated"
            )
        )
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar File is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar.url) {
        throw new ApiError(400,"Error while uploading avatar on Cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "avatar Updated Successfully"
        )
    )
})


const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
        throw new ApiError(400,"Avatar File is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage.url) {
        throw new ApiError(400,"Error while uploading avatar on Cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage:coverImage.url
            }
        },
        {new:true}
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "cover Image Updated Successfully"
            )
        )
})


export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}