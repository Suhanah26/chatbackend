import express from "express";
import { loginUser ,verifyUser,myProfile,getAllUsers,getAUser,updateUsers} from "../controllers/user.js";
import { isAuth } from "../middleWare/isAuth.js";
const router = express.Router();

router.post("/login", loginUser);
router.post("/verifyUser",verifyUser)
router.get("/myProfile",isAuth,myProfile)
router.get("/user/all",isAuth,getAllUsers)
router.get("/user/:id",getAUser)
router.put("/update/Users",isAuth,updateUsers)
export default router;
