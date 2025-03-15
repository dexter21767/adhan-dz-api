require('dotenv').config();
const path = require('path');
const metaDir = process.env.META_DIR || './../output';
const metadata = require(path.join(metaDir,"/metadata.json"));

const config = {
    db: path.join(metaDir,metadata.db_filename),
    port: process.env.PORT || 3000,
    metaDir: metaDir,
}

module.exports = config;