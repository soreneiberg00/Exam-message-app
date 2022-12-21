const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');


//Definerer først klassen for en bruger
class CreateUser{
    constructor(name, password, email){
        this.name = name,
        this.password = password,
        this.email = email
    }
}


const Connection = require('tedious').Connection;
const dbConfig = require('../dbConfig')
var Request = require('tedious').Request  

//Henter siden hvor der kan oprettes brugere
router.get('/',  (req, res) => {
    res.render('myProfile/register.ejs')
})

//HTTP request når der oprettes en ny bruger
router.post('/', async (req, res) => {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    let newUser = new CreateUser(req.body.name, hashedPassword, req.body.email)
    
    
        var connection = new Connection(dbConfig);  
        connection.on('connect', function(err) {  
            // If no error, then good to proceed.  
            console.log("Connected");  
            executeInsertUserQuery(newUser);  
        });
        res.redirect('/login')
    

    function executeInsertUserQuery(insertUser){
        //console.log('insertUserQuery' + insertUser)
        let request = new Request(`INSERT into dbo.Users (name, password, email)
            VALUES ('${insertUser.name}', '${insertUser.password}', '${insertUser.email}');`, function(err) {
            if(err){
                console.log(err);
            }
        })
          
        request.on('row', function(columns) {  
            columns.forEach(function(column) {  
              if (column.value === null) {  
                console.log('NULL');  
              } else {  
                console.log("Product id of user is " + column.value);  
              }  
            });  
        });

        // Close the connection after the final event emitted by the request, after the callback passes
        request.on("requestCompleted", function (rowCount, more) {
            connection.close();
        });
        connection.execSql(request);  
    } // end of function
    connection.connect();
})



module.exports = router