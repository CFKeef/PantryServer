const {test} = require('../environment')
const bcrypt = require('bcrypt');
const { as } = require('pg-promise');
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

// ADds a single product to db
const addProduct = async (newProduct, pantryID, accountID) => {
    const tabID = await getTabID(newProduct.location, accountID);
    return new Promise(async (resolve) => {
        resolve(db.any('INSERT INTO PANTRY.Product(id,pantryid,title,tabid,category,expirationdate,quantity,unit) VALUES($1,$2,$3,$4,$5,$6,$7, $8)', [newProduct.id, pantryID, newProduct.title,tabID,newProduct.category.value, newProduct.expirationDate, newProduct.quantity, newProduct.unit === '' ? "NONE" : newProduct.unit]));
    })
}

// Adds single tab to db
const addTab = async (id, location, accountID) => {
    return new Promise(async (resolve) => {
        resolve(db.any('INSERT INTO PANTRY.Tab(id,location,accountid) VALUES($1,$2,$3)', [id,location,accountID]));
    })
}


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
};

// Will check if the log in is correct
const validateUserLogin = async (email, pw) => {
    return db.any('Select * from Pantry.Account where emailaddress = $1 and verified = $2', [email, true])
    .then(data => {
        return bcrypt.compare(pw, data[0].password).then((result) =>{
            return result;
        });
    })
}



const getPantryIDs = async (accountID) => {
    return new Promise(async (resolve) => {
        resolve(await db.result('Select Pantry.ID From Pantry.Pantry as Pantry Where Pantry.AccountID = $1', [accountID])
                .then(data => {
                    return data.rows[0].id;
                }))
    });
}

const getTabID = async (location, accountID) => {
    return new Promise(async (resolve) => {
        resolve(await db.result('Select Tab.ID From Pantry.Tab as Tab where Tab.location = $1 and Tab.accountid = $2  ' , [location,accountID])
                .then(data => {
                    return data.rows[0].id;
                }))
    });
}


module.exports = {addUser, verifyUniqueEmail, addPantry, getIDsForActivation, updateUserVerifiedFlag, validateUserLogin, addProduct,getPantryIDs, addTab};