const { MongoClient, ObjectId } = require('mongodb');

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

async function runTransaction(client, fn) {
    const transactionOptions = {
        "readConcern": { "level": "majority" },
        "writeConcern": { "w": "majority" }
    };

    const session = client.startSession();
    try {
        session.startTransaction(transactionOptions);
        console.log('Transaction started.');

        await fn(session);

        await session.commitTransaction();
        console.log('Transaction successfully committed.');
    } catch (error) {
        console.log(`Transaction interupted: ${error.name}`);
    }
}

const updateDoc = async (session, collection, name) => {
    const documents = await collection.find({ randomBool: true }, { session }).toArray();
    console.log(`updateDoc: Found ${documents.length}`);

    if (documents.length >= 2) {
        console.log(`updateDoc: Updating "${name}"`);
        const result = await collection.updateMany({
            name
        }, {
            $set: {
                randomBool: false
            }
        }, {
            session
        });
        // console.log('debug', result);
    }
};

const updateDoc2 = async (session, collection, name) => {
    const findCondition = {
        randomBool: true
    };
    const documents = await collection.find(
        findCondition,
        { session }
    ).toArray();

    // locking select, making sure non of those are edited
    const lockedDocumentsQueries = await Promise.all(
        documents.map(async document => {
            const updateData = { $set: { myLock: { pseudoRandom: ObjectId() } } };
            return collection.findOneAndUpdate(
                { ...findCondition, _id: document._id },
                updateData,
                { session }
            );
        })
    );
    const lockedDocuments = lockedDocumentsQueries.filter(document => document.value);
    console.log(`updateDoc: Found ${documents.length}, ${lockedDocuments.length}`);
    if (documents.length !== lockedDocuments.length) throw new Error('Locking documents failed');


    if (documents.length >= 2) {
        console.log(`updateDoc: Updating "${name}"`);
        const result = await collection.updateMany({
            name
        }, {
            $set: {
                randomBool: false
            }
        }, {
            session
        });
        // console.log('debug', result);
    }
};

(async function main() {
    const { client, db, collection } = await initMongo();
    await collection.deleteMany({});

    await collection.insertOne({ _id: 1, name: 'bob', randomBool: true });
    await collection.insertOne({ _id: 2, name: 'alice', randomBool: true });
    await collection.insertOne({ _id: 3, name: 'testing', randomBool: false });
    console.log('inserted');

    let documents = [];
    documents = await collection.find({}).toArray();
    console.log(JSON.stringify(documents, null, 2));


    await Promise.all([
        runTransaction(client, (session) => updateDoc2(session, collection, 'bob')),
        runTransaction(client, (session) => updateDoc2(session, collection, 'alice'))
    ]);

    // await runTransaction(client, (session) => updateDoc(session, 'bob'));
    // await runTransaction(client, (session) => updateDoc(session, 'alice'));

    documents = await collection.find({}).toArray();
    console.log(JSON.stringify(documents, null, 2));
})();