var sqlite3 = require('sqlite3').verbose()

const DBSOURCE = "db.sqlite"

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
      console.error(err.message)
      throw err
    }else {
        console.log('Connected to the SQLite database.')
        db.run(`CREATE TABLE post (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            page text,
            title text, 
            change_description text DEFAULT "No Changelog entry", 
            md_edit text,
            edit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
            )`,
        (err) => {
            if (err) {
            }else{
                var insert = 'INSERT INTO post (page, title, change_description, md_edit, edit_time) VALUES (?,?,?,?,?)'
            }
        });  
    }
});

module.exports = db
