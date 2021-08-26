import express,{NextFunction, Request,Response} from 'express';
import dotenv from 'dotenv';
import {v4 as uuidv4} from "uuid";

const app = express();
interface IStatement {
    description:string,
    amount:number,
    createdAt: Date,
    type:string
}
export interface IAccount{
    id:string,
    cpf:string,
    name:string,
    statement:Array<IStatement>
}

const customers:IAccount[] = new Array<IAccount>();
dotenv.config();
app.use(express.json());
//middleware
function verifyIFExistsAccountCPF(request:Request,response:Response,next:NextFunction){
    const {cpf} = request.headers;
    const customer:IAccount|undefined = customers.find((customer:IAccount) => customer.cpf === cpf);
    if(!customer)   return response.status(400).json({message:"No user found"});
    request.user = customer;
    return next();
}

function getBalance(statement:Array<IStatement>):number{
    return statement.reduce((acc,operation)=>{
        if(operation.type === 'credit'){
            return acc + operation.amount;
        }else{
            return acc - operation.amount;
        }
    },0)
    
}

app.post("/account", (request:Request,response:Response):Response =>{
    const { cpf , name } = request.body;
    const customerAlreadyExists = customers.find(customers => customers.cpf === cpf);
    if(customerAlreadyExists){
        return response.status(400).json({message:"Cpf already exists"});
    }
    const id = uuidv4();
    const statement = new Array<IStatement>();
    customers.push({
        id:id,
        cpf:cpf,
        name:name,
        statement: statement
    })
    return response.status(201).json(customers);
});

app.get('/statement', verifyIFExistsAccountCPF, (request:Request, response:Response) => {
    const customer = request.user;
    return response.status(200).json(customer.statement)
});

app.get('/statement/date', verifyIFExistsAccountCPF, (request:Request, response:Response) => {
    const customer = request.user;
    const {date} = request.query;
    const dateFormat = new Date(date + " 00:00");
   
    const statement = customer.statement.filter((statement) => statement.createdAt.toDateString()===new Date(dateFormat).toDateString());
    if(statement.length ==0){
        return response.status(400).json({message:'No statement found'})
    }
    return response.status(200).json(statement)
});


app.post('/deposit',verifyIFExistsAccountCPF, (request:Request, response:Response) => {
    const {description, amount} = request.body;
    const customer = request.user;
    const statementOperation:IStatement = {
        description:description,
        amount:amount,
        createdAt: new Date(),
        type: 'credit'
    }
    customer.statement.push(statementOperation);
    return response.status(200).json(statementOperation);
})
app.post('/withdraw',verifyIFExistsAccountCPF, (request:Request, response:Response) => {
    const {description, amount} = request.body;
    const customer = request.user;
    const balance = getBalance(customer.statement);

    if(balance<amount){
        return response.status(400).json({message:'Insuficient balance'})
    }
    const statementOperation:IStatement = {
        description:description,
        amount:amount,
        createdAt: new Date(),
        type: 'debit'
    }
    customer.statement.push(statementOperation);
    return response.status(200).json(statementOperation);
})
app.put('/account',verifyIFExistsAccountCPF, (request:Request, response:Response)=>{
    const {name} = request.body;
    const customer = request.user;
    customer.name = name;
    return response.status(200).json(customer);
});
app.get('/account',verifyIFExistsAccountCPF,(request:Request, response:Response)=>{
    const customer = request.user;

    return response.status(200).json(customer);
})
app.delete('/account',verifyIFExistsAccountCPF,(request:Request, response:Response)=>{
    const customer = request.user;
    customers.splice(customer,1);
    return response.status(204).json(customers)
})

app.get('/balance', verifyIFExistsAccountCPF, (request:Request, response:Response)=>{
    const customer = request.user;
    return response.status(200).json({balance:getBalance(customer.statement)})
})
app.listen(process.env.PORT,()=>{
    console.log(`Server running on ${process.env.PORT}`);
});


