const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId, Admin } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();
const stripe = require("stripe")(process.env.STRIP_KEY);

app.use(cors());
app.use(express.json());
// const uri = "mongodb://localhost:27017";
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ctmwtm0.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader) {
  return  res.status(401).send({message:'unauthorized access'})
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return  res.status(401).send({message:'unauthorized access'})
        }
        req.decoded=decoded
        next()
    })
}

async function run() {
    try {
        const allPhone=client.db('easyBuy').collection('PhonesCategory')
        const Categories=client.db('easyBuy').collection('category')
        const bookingsCollection =client.db('easyBuy').collection('bookingsPhone')
        const usersCollection =client.db('easyBuy').collection('users')
        const paymentsCollection =client.db('easyBuy').collection('payments')
       
        app.get('/category', async (req, res) => {
            const query = {}
            const Category = await Categories.find(query).toArray();
            res.send(Category)
        })
        app.get('/category/:id', async (req, res) => {
            const id = req.params.id;
            const query = {categoryId:id}
            const phones = await allPhone.find(query).toArray();
            res.send(phones)
        })
        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment)
            const id = payment.bookingId;
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId:payment.transactionId
                }
            }
            const update=await bookingsCollection.updateOne(filter,updatedDoc)
            res.send(result)

        })
        app.get('/booking',verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decoded = req.decoded;
            if (decoded.email !== email) {
             res.status(403).send({ message: 'forbidden access' });
            }
            const query = { email: email };
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        });
        app.delete('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await bookingsCollection.deleteOne(query);
            res.send(result);
        })
        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const price = booking.price;
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            })
            res.send({
                clientSecret: paymentIntent.client_secret,
              });
        })
        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        })

        // verify user by  json web token
        app.post('/jwt', (req, res) => {
            const user = req.body;
            console.log(user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '360d' })
            res.send({token})
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
        
        app.get('/users/:users',verifyJWT, async (req, res) => {
            const users = req.params.users;
            const query = {role:users};
            const result = await usersCollection.find(query).toArray();
            res.send(result);
        });

        //delete Buyers from admin dashboard
        app.delete('/user/:id',verifyJWT, async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: ObjectId(id) }
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        })
        // get all sellers in admin dashboard
        app.get('/seller/:seller',verifyJWT, async (req, res) => {
            const seller = req.params.seller;
            const query = {role:seller};
            const result = await usersCollection.find(query).toArray();
            res.send(result);
        });
        // delete sellers from Admin dashboard
        app.delete('/seller/:id',verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await usersCollection.deleteOne(query)
            res.send(result);
            
})
        // addPhone
        app.put('/addPhone',verifyJWT, async (req, res) => {
            const query = req.body;
            const result = await allPhone.insertOne(query);
            res.send(result);
        })
        //Get My all Prodcuts

        app.get('/myproduct',verifyJWT, async (req, res) => {
            const email = req.query.email
            const query = { email: email };
            const result = await allPhone.find(query).toArray();
            res.send(result)
        })

        //delete products from seller in dashboard
        app.delete('/myproducts/:id',verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await allPhone.deleteOne(query);
            res.send(result);
    
        })
        app.put('/report/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    report: 'reported'
                }
            }
            const result = await allPhone.updateOne(filter, updatedDoc, options);
            res.send(result);
        })
        app.get('/report', async (req, res) => {
            const report = req.query.report
            const query = { report: report };
            const result = await allPhone.find(query).toArray();
            res.send(result)
        })
        //payment 
        app.get('/payment/:id', async (req, res) => {
            const id = req.params.id;
            const query={_id:ObjectId(id)}
            const result = await bookingsCollection.findOne(query)
            res.send(result)
        })
        app.put('/seller/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    verify:'verified'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
})
    //checking  is seller verified? 
        app.get('/sellerVerified/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const query = { email: id }
            console.log(query);
            const result = await usersCollection.findOne(query)
            res.send(result)
        })
        //set advertisement product from seller 
        app.put('/advertise/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    status: 'advertise'
                } 
            }
            const result = await allPhone.updateOne(filter, updatedDoc, options);
            res.send(result);
        })
        //display the advertisement product on home 
        app.get('/advertise', async (req, res) => {
            const filter = req.query.status;
            const query = { status: filter }
            const result = await allPhone.find(query).toArray()
            res.send(result)
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