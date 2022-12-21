if(process.env.NODE_ENV !== ' production') {
    require('dotenv').config()
};


//Import af DB
const Connection = require('tedious').Connection;
const dbConfig = require('./dbConfig')
var Request = require('tedious').Request  
//var TYPES = require('tedious').TYPES;

//Importerer de nødvendige node-packages
const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const flash = require('express-flash');
const methodOverride = require('method-override');
const session = require('express-session');
const registerRoute = require('./routes/createUser')


app.use(express.urlencoded({
  extended: true
}))

//Sææter applikationen op
app.use('/register', registerRoute)
app.use(express.static(__dirname + '/public'))
app.set('view-engine', 'ejs');
app.use(express.urlencoded ({ extended : false }))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false

}))
app.use(methodOverride('_method'));



//Routes

//Login siden
app.get('/login',  (req, res) => {
    res.render('myProfile/login.ejs')
})

// Når brugeren poster data for at logge ind
app.post('/login', express.urlencoded({extended: false}), function(req, res) {
    function findUserInDatabase(email){
        var connection = new Connection(dbConfig);  
        connection.on('connect', function(err) {  
            // If no error, then good to proceed.  
            executeUserFromDatabase(email)
        }); 
        connection.connect();
    
    
        function executeUserFromDatabase(email){
            let request = new Request(`SELECT * FROM dbo.Users Where email = '${email}' FOR JSON AUTO`, function(err) {
                if (err){
                    console.log(err);
             }
            });
    
            var result = "";  
            request.on('row', function(columns) {  
                columns.forEach(function(column) {  
                if (column.value === null) {  
                    console.log('NULL');  
                    } else {  
                        result+= column.value + " ";  
                    }  
                });              
            let userInArray = JSON.parse(result)
            let user = userInArray.pop()
            
            async function checkUser(loginPassword){
                const match = await bcrypt.compare(loginPassword, user.Password)
                
                if(match){
                    req.session.regenerate(function (err) {
                        if (err) next(err)
                        
                        req.session.email = user.Email
                        req.session.name = user.Name
                        req.session.id = user.User_id

                        req.session.save(function(err){
                            if(err) return next(err)
                            res.redirect('/')
                        })
                    })
                } else {
                    res.redirect('/login')
                }
            
            }
            checkUser(req.body.password)
               
            });
        
            request.on('done', function(rowCount, more) {  
            console.log(rowCount + ' rows returned');  
            }); 
    
            request.on("requestCompleted", function (rowCount, more) {
                connection.close();
                
            });
    
            connection.execSql(request);  
        }
    }
    findUserInDatabase(req.body.email)  
})


//Siden hvor brugerne kan oprette beskeder
app.get('/create', (req, res) => {
  res.render('./homepage/create.ejs')    
});

//Henter klassen til at sende beskeder
const EmailClass = require('./routes/createEmail.js')

//Når brugeren skal sende en besked
app.post('/create',  (req, res) => {
  let newEmail = new EmailClass('id is created in database', req.body.recieverEmail, "date is created in database", req.body.message)
  
  EmailClass.createEmail(newEmail)
  res.redirect('/')
})


//Sætter brugeren indbakke op
app.get('/', (req, res) => {
  messagesInDoubleArray = []
  userMail = req.session.email;
  
  var connection = new Connection(dbConfig);  
  connection.on('connect', function(err) {  
      // If no error, then good to proceed.
      queryFullOuterJoinListingsAndUsers()
  }); 
  connection.connect();
  

  function queryFullOuterJoinListingsAndUsers(){
      let request = new Request(`SELECT TOP 10 Message, Sent_date
      FROM [dbo].[Messages]
      WHERE To_user_email = '${userMail}' OR message_ID = 15
      ORDER BY Sent_date DESC
      FOR JSON PATH`, function(err) {
          if (err){
              console.log(err);
       }
      });

      var result = "";  
      request.on('row', function(columns) {  
          columns.forEach(function(column) {  
          if (column.value === null) {  
              console.log('NULL');  
              } else {  
                  result+= column.value + " ";  
              }  
          }); 
      resultParsed = JSON.parse(result)
      messagesInDoubleArray.push(resultParsed)
      result ="";  
      });
  
      request.on('done', function(rowCount, more) {  
      console.log(rowCount + ' rows returned');  
      }); 

      request.on("requestCompleted", function (rowCount, more) {
          connection.close();
          let messagesInSingleArray = messagesInDoubleArray.shift()
          res.render('homepage/index.ejs', { messageData: messagesInSingleArray, name: req.session.name})
      });

      connection.execSql(request);  
  }
})

//Sætter serveren til at lytte
PORT = 3000
app.listen(PORT)
console.log(`Server is listening on port ${PORT}`)