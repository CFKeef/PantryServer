const nodemailer = require('nodemailer');
const {gmail, key} = require('../environment');
const pg = require('../postgresql/index');
const jwt = require("jsonwebtoken");

// Handles sending the activation email
const sendActivationEmail = async (userEmail) => {
    const userInfo = await pg.getIDsForActivation(userEmail);
    const token = generateActivationToken(userInfo);

    // SMTP Server
    const smtp = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: gmail.User,
            pass: gmail.Pass
        }
    });

    const email = {
        from: "Hi@Pantree.io",
        to: userEmail,
        subject: "Account Activation",
        text: "Click on the link below to veriy your account " + "http://192.168.1.194:19005/activation?id=" + token
    }

    const info = await smtp.sendMail(email, (err) => {
        if(err) {
            console.log(err);
            return false;
        }
        else return true;
    })
};

const generateActivationToken = (info) => {
    return jwt.sign(info, key, {expiresIn: '1d'});
}

module.exports = {sendActivationEmail}