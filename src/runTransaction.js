
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


module.exports = {
    runTransaction
};
