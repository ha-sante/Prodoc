const exec = require('child_process').exec;


if (process.env.PRISMA_SQL_DATABASE_SERVICE_CONNECTION_STRING) {
    exec(`npm i -g prisma && prisma migrate deploy`, (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(stdout);
    });

    console.log("Continiouing with the others.")
}

exec(`node server.js`, (err, stdout, stderr) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(stdout);
});