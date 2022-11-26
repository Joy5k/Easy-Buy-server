const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();


app.use(cors());
app.use(express.json());
// const uri = "mongodb://localhost:27017";
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ctmwtm0.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        const phonesCategory=client.db('easyBuy').collection('PhonesCategory')
        const Categories=client.db('easyBuy').collection('category')
        const bookingsCollection =client.db('easyBuy').collection('bookingsPhone')
        const usersCollection =client.db('easyBuy').collection('users')
       
        app.get('/category', async (req, res) => {
            const query = {}
            const Category = await Categories.find(query).toArray();
            res.send(Category)
        })
        app.get('/category/:id', async (req, res) => {
            const id = req.params.id;
            const query = {categoryId:id}
            const phones = await phonesCategory.find(query).toArray();
            res.send(phones)
        })
        app.get('/booking', async (req, res) => {
            const email = req.query.email;
            // const decodedEmail = req.decoded.email;

            // if (email !== decodedEmail) {
            //     return res.status(403).send({ message: 'forbidden access' });
            // }

            const query = { email: email };
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        });

        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        })
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            console.log(email,'user eamil')
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '10d' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
        });
        app.post('/user', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });
           app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
           })
        
        // check seller
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.role === 'seller' });
        })

        // get all buyers
        
        app.get('/users/:users', async (req, res) => {
            const users = req.params.users;
            const query = {role:users};
            const result = await usersCollection.find(query).toArray();
            res.send(result);
        });
        app.delete('/user/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: ObjectId(id) }
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        })
        app.get('/seller/:seller', async (req, res) => {
            const seller = req.params.seller;
            const query = {role:seller};
            const result = await usersCollection.find(query).toArray();
            res.send(result);
        });
        // addPhone

        app.put('/addPhone', async (req, res) => {
            const query = req.body;
            const result = await phonesCategory.insertOne(query);
            res.send(result);
        })
        //Get My all Prodcuts
        app.get('/myproduct', async (req, res) => {
            const email = req.query.email
            const query = { email: email };
            const result = await phonesCategory.find(query).toArray();
            res.send(result)
        })
        app.delete('/myproducts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await phonesCategory.deleteOne(query);
            res.send(result);
    
        })
    } 
    finally {
        
    }
    
}
run().catch(error => console.log(error, 'the from main function'))

app.get('/', (req, res) => {
    res.send('server is Running(Assignment)')
})

app.listen(port, () => {
    console.log(`server is running on ${port}`);
})
