const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
//jwt here
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();



app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ctmwtm0.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
console.log(uri);

async function run() {
    try {
        const phonesCategory=client.db('easyBuy').collection('PhonesCategory')
        app.get('/category', async (req, res) => {
            const query = {}
            const Category = await phonesCategory.find(query).toArray();
            res.send(Category)
        })
        app.get('/category/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const phones = await phonesCategory.findOne(query)
            res.send(phones)
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
