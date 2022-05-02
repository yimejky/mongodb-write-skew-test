const { MongoClient } = require('mongodb');

async function initMongo() {
    const url = 'mongodb://localhost:27018';
    const dbName = 'testingProject';

    const client = new MongoClient(url, {
        writeConcern: 'majority'
    });

    await client.connect();
    console.log('Connected successfully to server');

    const db = client.db(dbName);
    const collection = db.collection('documents');

    return { client, db, collection };
}

module.exports = {
    initMongo
};
