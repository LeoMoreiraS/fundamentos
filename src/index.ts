import express,{Request,Response} from 'express';
import dotenv from 'dotenv';
const app = express();
dotenv.config();
app.listen(process.env.PORT,()=>{
    console.log(`Server running on ${process.env.PORT}`);
});
app.get('/',(request:Request,response:Response)=>{
    return response.json({message:"Coe!"});
})