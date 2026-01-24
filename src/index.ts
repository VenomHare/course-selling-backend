import express from "express";
import cors from "cors"
import dotenv from "dotenv";
import authRouter from "./routers/auth.router";
import coursesRouter from "./routers/courses.router";
import lessonsRouter from "./routers/lesson.router";
import purchaseRouter from "./routers/purchase.router";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use((req, res, next)=> {
    console.log(req.method, req.url, JSON.stringify(req.body));
    next();
});

app.use("/auth", authRouter);
app.use("/courses", coursesRouter);
app.use("/lessons", lessonsRouter);
app.use("/", purchaseRouter);

app.listen(3000, () => {
    console.log("Running on port 3000")
})