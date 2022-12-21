//Opretter en klasse til emails
class EmailClass{
    constructor(from_User_email, to_User_email, sent_date, message){
        this.from_User_email = from_User_email,
        this.to_User_email = to_User_email,
        this.sent_date = sent_date,
        this.message = message
    }
    
    //Opretter en funktion i klassen
    static createEmail(createdEmail){
        var connection = new Connection(dbConfig);  
        connection.on('connect', function(err) {  
            // If no error, then good to proceed.  
            insertEmailIntoDatabase(createdEmail)
        }); 
        connection.connect();
    
        function insertEmailIntoDatabase(createdEmail){
            
            let request = new Request(`INSERT into dbo.messages (From_User_email, To_User_email, Sent_date, Message)
                VALUES ('test@test', '${createdEmail.to_User_email}', CURRENT_TIMESTAMP, '${createdEmail.message}');`, 
                function(err) {//defines the query using the Request Class imported from Tedious.js
                if(err){
                    console.log(err);
                }
            })
            connection.execSql(request);
            request.on("requestCompleted", function (rowCount, more) {//defines what happens when the database tells the server that the request (query) is complete
                connection.close();//closes the connection to the database
            });
             
        }
            
    }
}


const Connection = require('tedious').Connection;
const dbConfig = require('../dbConfig')
var Request = require('tedious').Request  


module.exports = EmailClass