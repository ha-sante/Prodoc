const exec = require('child_process').exec;


if (process.env.PRISMA_SQL_DATABASE_SERVICE_CONNECTION_STRING) {
    exec(`prisma migrate deploy`, (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(stdout);
    });
}

exec(`node server.js`, (err, stdout, stderr) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(stdout);
});