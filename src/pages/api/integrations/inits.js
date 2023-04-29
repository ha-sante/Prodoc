// Any type of initiations on app build - e.g Database etc
import fauna from './fauna'


function FaunaDatabaseInitiations() {
    // CREACTE COLLECTIONS - ACCOUNTS, CONTENT, CONFIGURATIONS
    fauna.client.query(
        q.CreateCollection({ name: 'Accounts' })
    ).then((ret) => console.log(ret)).catch((err) => console.error(
        'Error: [%s] %s: %s',
        err.name,
        err.message,
        err.errors()[0].description,
    ));

    fauna.client.query(
        q.CreateCollection({ name: 'Content' })
    ).then((ret) => console.log(ret)).catch((err) => console.error(
        'Error: [%s] %s: %s',
        err.name,
        err.message,
        err.errors()[0].description,
    ));

    fauna.client.query(
        q.CreateCollection({ name: 'Configurations' })
    ).then((ret) => console.log(ret)).catch((err) => console.error(
        'Error: [%s] %s: %s',
        err.name,
        err.message,
        err.errors()[0].description,
    ));
}

function Initiations() {
    FaunaDatabaseInitiations();
}

Initiations();