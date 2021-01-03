const express = require("express");
const app = express();
const cors = require('cors');
const mailer = require('./nodemailer/index.js');
const jwt = require('jsonwebtoken');
const pg = require('./postgresql/index.js');

const {key} = require('./environment');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));

// Account Routes
app.post("/signup", async (req, res) => {
    const userInfo = req.body;
    // See if user is already signed up
    const unique = await pg.verifyUniqueEmail(userInfo.email);
    let added = false;
    
    // Add to our db
    if(!unique) {
        added = await pg.addUser(userInfo.email, userInfo.pw);
        await pg.addPantry(userInfo.email);
    }

    if(added) {
        await mailer.sendActivationEmail(userInfo.email);
        res.sendStatus(200);
    }
    else res.sendStatus(400)
});

app.post("/login", async (req, res) => {
    const userInfo = req.body;
    const isValid = await pg.validateUserLogin(userInfo.email, userInfo.pw)

    if(isValid) {
        const accountData = await pg.getIDsForActivation(userInfo.email);
        const pantryData = await pg.getPantryIDs(accountData.id);
        const getTabs = await pg.getTabsForUser(accountData.id);
        const getProducts = await pg.getProductsForUser(pantryData);
        const data = {email: userInfo.email, accountID: accountData.id, pantryID: pantryData, tabs: getTabs, products: getProducts };
        res.status(200).send(data);
    }
    else res.sendStatus(403);
});

app.post("/recover", (req, res) => {
    
});

// Data routes
app.get("/getTabs", async (req, res) => {
    const getTabs = await pg.getTabsForUser(res.body.accountID);
    res.sendStatus(200).send(getTabs);
});

app.post("/setTabs", (req, res) => {

});

app.post("/addTab", async (req, res) => {
    const isUpdated = await pg.addTab(req.body.id, req.body.location, req.body.accountID);

    if(isUpdated) res.sendStatus(200);
    else res.sendStatus(403);
});

app.get("/getProducts", (req, res) => {

});

app.post("/setProducts", (req, res) => {

});

app.post("/addProduct", async (req, res) => {
    const isUpdated = await pg.addProduct(req.body.product, req.body.pantryID, req.body.accountID);

    if(isUpdated) res.sendStatus(200);
    else res.sendStatus(403);
});

app.post("/activation", (req, res) => {
    const token = req.query.id;

    if(token) {
        try{
            jwt.verify(token, key, (e, decoded) => {
                if(e) {
                    return res.sendStatus(403);
                }
                else {
                    // Took too long to activate
                    if(decoded.exp * 1000 < Date.now()) return res.sendStatus(403);
                    else {
                        pg.updateUserVerifiedFlag(decoded.id);
                        res.redirect("/")
                    }
                }
            })
        }
        catch(e) {
            console.log(e);
        }
    }
    else res.sendStatus(403);
});

app.listen(19005, () => {console.log("Running!")})