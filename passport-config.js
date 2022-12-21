//the code in this file is used for the login/authentication of user.
const Connection = require('tedious').Connection;//import from tedious which is used to connect to MSSQL database


const bcrypt = require('bcrypt');
const dbConfig = require('./dbconfig');//importing data from dbConfig for db queries
const Null = require('tedious/lib/data-types/null');
let Request = require('tedious').Request//class imported from tedious to create SQL queries in node.js and then send them to an SQL database
let TYPES = require('tedious').TYPES
const LocalStrategy = require('passport-local').Strategy//class imported from passport.js

let signedInUsers = []//array which all SignedInUsers are pushed to after being loaded from the database. When a user logs out, that user will be removed from this array, however this has not been implemented yet 

function initialize(passport, getUserByEmail, getUserById) {//function which is called when authenticating a user. getUserByEmail and getUserByID, are defined when the function is call on line 28 in the server.js file. this function is used to pass the email and the password from the input data in the client
//this function defines and calls several functions that are used in the authentication process 
  
  const authenticateUser = (email, password, done) => {//the defintion of the authenticate user function, which is call on line 70 
    var connection = new Connection(dbConfig); 
    connection.connect();//creates the connection to the database
    
      connection.on('connect', async function(err) {  //start of definition of what happens when connected to database
          // If no error, then good to proceed.   
          let request = new Request(`SELECT * FROM dbo.Users WHERE email = '${email}' FOR JSON AUTO`, function(err) {//the creation of the query that is sent to the database. FOR JSON AUTO means that the data is return in a JSON format
            if (err){
                console.log(err);
            }
        });
    
        var result = "";//creating the variable of result, which is currently empty  
        request.on('row', function(columns) {  
            columns.forEach(function(column) {  
            if (column.value === null) {  //if the query returns no value/columns then the code should console.log null
                console.log('NULL');  
            } else {  
                result+= column.value + " ";  //if there is data returned from the query then that data is added to the result variable. the data added is in a JSON format
            }  
        });  
        let userGoingToSignInArray = JSON.parse(result)//this takes the JSON data in the result variable and turns it into normal JS array and saves it as the userGoingToSignInArray variable
        let userGoingToSignIn = userGoingToSignInArray.shift()//this then takes the variable created above and removes the object/element within the array, so that it is a normal object. this is necessary because the next line of code does not work if the data is in an array.
        decideUserTypeForSigningIn(userGoingToSignIn)
        //the Class object created on line 36 is pushed to the signedInUsers array, where it can then be read and authenticated
        result ="";//this returns the variable to it's original empty value
        });
    
       /* request.on('done', function(rowCount, more) {
        console.log(rowCount + ' rows returned');
        });*/ 
    
        request.on("requestCompleted", function (rowCount, more) {//defining what happens when the database returns the message 'requestCompleted'
          authenticateUserAnswer() //runs the authenticateUserAnswer function that is defined on line 54
          connection.close();//closes the connection to the database
        });

         
        connection.execSql(request);//this tells the server to send the request, defined on line 19, to the database
        
        const authenticateUserAnswer = () => {//start of authenticateUserAnswer function definition
          const user = getUserByEmail(email)//finds the user based on email, this function is defined on line 29 of the server.js file and can be used in this scope because it is a paramater of the itialize function that starts on line 11 and end on line 76 of this file
          //email has to be unique on the database so there should never be more than 1 possible user loaded into the user variable. The password belonging to that email also has to be correct for it to be return from the database, so there is no need for password verification here
          if (user == null) {//if there is no data in the user variable (meaning that the password and/or email sent to the database do not belong together) then the next line fires
            return done(null, false, { message: 'Email and/or password incorrect' })//done is a function imported from passport.js, and this sends no user back to the server to be verified and instead shows the message 'email and/or Password incorrect' onto the client
          } else {//if a user is found inside the user variable then the next line of code happens
            return done(null, user)//the user is verified and there sent to be authenticated
          }
        }//end of authenticateUserAnswer definition

        class SignedInUser{
            constructor(id, name, password, email){
                this.id = id,
                this.name = name,
                this.password = password,
                this.email = email
            }
        }

        function decideUserTypeForSigningIn(userGoingToSignIn) {
            let userSigningIn = new SignedInUser(userGoingToSignIn.id, userGoingToSignIn.name, userGoingToSignIn.password, userGoingToSignIn.email)
            bcrypt.compare(password)
            signedInUsers.push(userSigningIn)
        }
        
      
        
      }); //end of what happens when connected to datase
  }

  passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser))//
  passport.serializeUser((user, done) => done(null, user.id))//a user is serialized if they have signed in and not signed out. this is used for persistent login (forblive logget ind)
  passport.deserializeUser((id, done) => {//a user is deserialized when signing out, so that persistent login no longer works
    return done(null, getUserById(id))
  })
  
}

exports.initialize = initialize//exporting the initialize function
exports.signedInUsers = signedInUsers//exporting the signedInUsers Array