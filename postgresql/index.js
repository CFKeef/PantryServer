const {test} = require('../environment')
const bcrypt = require('bcrypt');
const saltRounds = 10;
const pgp = require('pg-promise')();

// Connects our driver to postgres server
const db = pgp({
    connectionString: test,
    ssl: {
        rejectUnauthorized : false
    }
});

db.connect()
    .then(obj => {
        console.log("Connected");
        obj.done();
    })
    .catch(err => {console.log(err.message)});


// Will add the new account into the appropriate table 
const addUser = async (email, pw) => {
    const hash = await hashPw(pw);

    return new Promise(async (resolve) => {
        resolve(await db.any('INSERT INTO PANTRY.ACCOUNT(emailaddress,password,verified) VALUES($1, $2, $3)', [email, hash, 'false']));
    })
};

// Creates a pantry for the user's data
const addPantry = async (email) => {
    return new Promise(async (resolve) => {
        db.result('Select * From Pantry.Account Where emailaddress = $1', [email])
          .then(data => {
            const id = data.rows[0].id;
            resolve(db.any('INSERT INTO PANTRY.Pantry(AccountID) VALUES($1)', [id]))
          }
          ).catch(err => {
            console.log(err);
          });
    })
};

// Checks if the user has an account already
const verifyUniqueEmail = async (email) => {
    return new Promise(async (resolve) => {
        resolve(await db.oneOrNone('Select * from Pantry.Account where emailaddress = $1', [email], a => !!a))
    });
}

// Hashes and returns a hashed pw
const hashPw = async (pw) => {
    return await bcrypt.hash(pw, 10);
}

// Get table id for account and pantry
const getIDsForActivation = async (email) => {
    return new Promise(async (resolve) => {
        resolve(await db.result('Select Account.ID, Account.EmailAddress From Pantry.Account as Account Where Account.EmailAddress = $1', [email])
                .then(data => {
                    return data.rows[0];
                }))
    });
};

// Updates user verified flag to trye
const updateUserVerifiedFlag = async (userID) => {
    return new Promise(async (resolve) => {
        resolve(await db.any('UPDATE Pantry.Account SET verified = true where id = $1', [userID]));
    })
}
module.exports = {addUser, verifyUniqueEmail, addPantry, getIDsForActivation, updateUserVerifiedFlag};