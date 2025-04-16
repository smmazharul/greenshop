import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors';
import connectDB from './configs/db.js';
import 'dotenv/config'
import userRouter from './routes/userRoute.js';
import bodyParser from 'body-parser';
import sellerRouter from './routes/sellerRoute.js';
import connectCloudinary from './configs/cloudinary.js';
import productRouter from './routes/productRoute.js';
import cartRouter from './routes/cartRoute.js';

const app = express();

const port = process.env.PORT || 5000;

await connectDB()
await connectCloudinary()

// Allowed multiple origins 
const allowedOrigin = ['http://localhost:5173']

// Middleware configuration
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json()); 
app.use(cors({origin:allowedOrigin,credentials:true}))





app.get('/',(req,res)=>{
    res.send("API is working");
})

app.use('/api/user',userRouter)
app.use('/api/seller',sellerRouter)
app.use('/api/product',productRouter)
app.use('/api/cart',cartRouter)


app.listen(port,()=>{
    console.log(`Server is running on port: ${port}`)
})

