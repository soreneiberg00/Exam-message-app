//En fil der definerer hvilken database, der skal forbindes til

var config = {  
    server: 'dba-serveren.database.windows.net', 
    authentication: {
        type: 'default',
        options: {
            //Adgangskoden skal opdateres for at få forbindelse
            userName: 'dba-serveren', 
            password: 'KODE'  
        }
    },
    options: {
        // If you are on Microsoft Azure, you need encryption:
        encrypt: true,
        database: 'Mail-system'  
    }
}; 

module.exports = config