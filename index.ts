import express, { Response, Request} from 'express';

const app = express();
const PORT = 3000;

app.get('/', (req: Request, res: Response) => {
    res.status(200).json("Request was a success.")
})

app.listen(PORT, () => {
    console.log("server is running")
})