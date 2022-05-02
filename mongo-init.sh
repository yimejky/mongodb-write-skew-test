#!/bin/bash

docker exec -it "testing-mongo_testing-mongo0_1" /bin/sh -c 'mongo --host localhost:27017 <<EOF
var cfg = {
    "_id": "rs0",
    "members": [
        {
            "_id": 0,
            "host": "testing-mongo_testing-mongo0_1:27017",
            "priority": 3
        },
        {
            "_id": 1,
            "host": "testing-mongo_testing-mongo1_1:27018",
            "priority": 0
        },
        {
            "_id": 2,
            "host": "testing-mongo_testing-mongo2_1:27019",
            "priority": 0
        }
    ]
};
rs.initiate(cfg, { force: true });
rs.reconfig(cfg, { force: true });
// rs.secondaryOk();
// db.getMongo().setReadPref("nearest");
// db.getMongo().setSecondaryOk();
EOF'
