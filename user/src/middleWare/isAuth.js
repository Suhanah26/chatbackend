import jwt, {} from "jsonwebtoken";
import dotenv from "dotenv";
import TryCatch from "../config/tryCatch.js";
dotenv.config();
export const isAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1] || "";
        if (!token || !token.startsWith("Bearer ")) {
            res.status(401).json({ message: "No token provided" });
        }
        const storedToken = process.env.JwtToken;
        const decodedUser = jwt.verify(token, storedToken);
        if (!decodedUser || !decodedUser?.user) {
            res.status(401).json({ message: "authentication failed,invalid token " });
        }
        req.user = decodedUser.user;
        next();
    }
    catch (error) {
        res.status(401).json({ message: "jwt token code error" });
        console.log(error);
    }
};
//# sourceMappingURL=isAuth.js.map