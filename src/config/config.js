import dotenv from 'dotenv';

dotenv.config({debug: true});

const config = {
    port: process.env.PORT || "7512",
    keySecret: process.env.KEY_SECRET || "zaqwer"
}


export default config;