import express from 'express';
import path from 'path';
import fs from 'fs';
import {MongoClient } from 'mongodb';
import { fileURLToPath } from 'url';
import multer from 'multer';
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import bodyParser from 'body-parser'

import mongoose from 'mongoose';


dotenv.config()

const jsonParser = bodyParser.json()

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)
console.log(__dirname);

const app = express()
const port = 8000
//here is a change
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '../build')));

app.use(express.static(path.join(__dirname, '../posters')));
//app.use(express.static("posters"));

const upload = multer({ dest: 'posters/' })

mongoose.connect(process.env.MONGO_CONNECT, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
    });

app.get(/^(?!\/api).+/, (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'))
});

const customerSchema = new mongoose.Schema({
    name: String,
    movie: String,
    email: {
        type: String,
        required: true
    }
});

app.use(bodyParser.json());
const Customer = mongoose.model('Customer', customerSchema);
app.post('/api/addInfo', (req, res) => {


    const { name, movie, email } = req.body;
    console.log(req.body);

    if (!name || !movie || !email) {
        return res.status(500).json({ error: 'Missing required fields' });
    }

    const newCustomer = new Customer({
        name: name,
        movie: movie,
        email: email
    });

    newCustomer.save()
        .then(() => {
            res.status(200).json({ message: 'Customer info saved successfully' });
        })
        .catch((error) => {
            res.status(500).json({ error: 'Failed to save customer info' });
        });
});


app.get('/api/movies', async (req, res) => {
    
    //res.json(movieData)
    const client = new MongoClient(process.env.MONGO_CONNECT);
    
    await client.connect();

    const db = client.db('movies');

    const movieData = await db.collection('reviews').find({}).toArray();
    console.log(movieData);
    console.log(res.statusCode);
    res.json(movieData);

})

app.post('/api/removeMovie', async (req, res) => {
   console.log(req.body.title);
   
   const client = new MongoClient(process.env.MONGO_CONNECT);
   await client.connect();

   const db = client.db('movies');
   const result = await db.collection('reviews').deleteOne({ title: req.body.title})
  
   res.sendStatus(200);
})

app.post('/api/overwrite', jsonParser, async (req, res) => {
  const client = new MongoClient(process.env.MONGO_CONNECT);
  await client.connect();

  const db = client.db('movies');

  //console.log(req.body);
  /*for( let index in req.body ) {
    console.log(req.body[index].title + " " + req.body[index].poster);
  }*/

  const deleteResult = await db.collection('reviews').deleteMany({});
  console.log('Deleted documents =>', deleteResult);

  const insertResult = await db.collection('reviews').insertMany(req.body);
  console.log('Inserted documents =>', insertResult);

  res.sendStatus(200);


})

app.post('/api/review', upload.single('movie_poster'),  async (req,res) => {
  const client = new MongoClient(process.env.MONGO_CONNECT);
  await client.connect();

  const db = client.db('movies');


  const insertOperation = await db.collection('reviews').insertOne( {'title':req.body.title, 'poster':req.file.filename});
  console.log(insertOperation);
  res.redirect('/');

    /*movieData.push( { "title":req.body.title })
    saveData();
    console.log("update movies called");
    console.log(req.body);
    res.redirect('/');*/
})


const saveData = () => {
  const jsonContent = JSON.stringify(movieData);
  fs.writeFile("./movies.json", jsonContent, 'utf8', function (err) {
    if (err) {
        console.log("An error occured while writing JSON Object to File.");
    }
    console.log("JSON file has been saved.");
  });
}



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
