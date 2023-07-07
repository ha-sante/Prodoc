const exec = require('child_process').exec;


if (process.env.PRISMA_SQL_DATABASE_SERVICE_CONNECTION_STRING) {
    exec(`sudo npm i -g prisma && sudo prisma migrate deploy`, (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(stdout);
    });

    console.log("Reached prisma install & migrate section")
}

exec(`node server.js`, (err, stdout, stderr) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(stdout);
});