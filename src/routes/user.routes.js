import { Router } from "express";
import {
    changeCurrentPassword,
    getCurrentUser,
    getUserChannelProfile,
    getWatchHistory,
    loginUser,
    logOutUser,
    refreshAccessToken,
    registerUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyjwt } from "../middlewares/auth.middleware.js";

const router = Router()


router.route("/register").post(upload.fields([
    {
        name: "avatar",
        maxCount:1
    },
    {
        name: "coverImage",
        maxCount:1
    }
]), registerUser)

router.route("/login").post(loginUser)

// Secure Routes
router.route("/logout").post(verifyjwt, logOutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyjwt, changeCurrentPassword)
router.route("/current-user").get(verifyjwt, getCurrentUser)
router.route("/update-account").patch(verifyjwt, updateAccountDetails)
router.route("/avatar").patch(verifyjwt,upload.single("avatar"),updateUserAvatar)
router.route("/cover-image").patch(verifyjwt, upload.single("coverImage"), updateUserCoverImage)
router.route("/channel/:username").get(verifyjwt, getUserChannelProfile)
router.route("/watchHistory").get(verifyjwt,getWatchHistory)

export default router