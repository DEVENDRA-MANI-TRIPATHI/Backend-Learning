import cookieParser from "cookie-parser";
import express from "express";

const app = express();

// configurations of middlewares
app.use(cors());
app.use(express.json({ limit: "16kb" })); // for parsing the json data and limit is 16kb if you need more than that adjust it accordingly
app.use(express.urlencoded({ extendd: true }));
app.use(express.static("public"));  // for saving files on server on temporary basis
app.use(cookieParser({ limit: "16kb" }));  //for ending the cookies from backend to frontend and vice versa



export default app;