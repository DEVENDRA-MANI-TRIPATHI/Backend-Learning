import { Router } from "express";
import { loginUser, logOutUser, registerUser } from "../controllers/user.controller.js";
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
export default router