const express = require('express');
const cors = require('cors');
var jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const query = require('express/lib/middleware/query');
require('dotenv').config()

// middleware
app.use(cors())
app.use(express.json())


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access.' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        console.log('decoded', decoded)
        req.decoded = decoded
        next();
    })
}


app.get('/', (req, res) => {
    res.send("Genius Car Services Home")
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.clafk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db('geniusCar').collection('services')
        const ordersCollection = client.db('geniusCar').collection('orders')


        app.get('/services', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query)
            const services = await cursor.toArray()
            // console.log(result)
            res.send(services)
        })
        app.get('/service/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const service = await serviceCollection.findOne(query)
            res.send(service)
        })

        // auth
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            })
            res.send({ accessToken })
        })

        // service api
        //post
        app.post('/services', async (req, res) => {
            const newService = req.body
            const service = await serviceCollection.insertOne(newService)
            res.send(service)
        })

        //delete
        app.delete('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const service = await serviceCollection.deleteOne(query)
            console.log(service)
            res.send(service)
        })

        // orders collection api
        app.get('/orders', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (email === decodedEmail) {
                const query = req.query
                const cursor = ordersCollection.find(query)
                const orders = await cursor.toArray()
                res.send(orders)
            }
            else {
                res.status(403).send({ message: 'forbidden access' })
            }
        })

        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order)
            res.send(result)
        })


    } finally {

    }
}
run().catch(console.dir)

app.listen(port, () => {
    console.log("Port: ", port)
})