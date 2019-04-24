"use strict";
class Profile {

  constructor (data) {
    this.username = data.username;
    this.name = data.name;
    this.password = data.password;
    this.wallet = {RUB: 0, USD: 0, EUR: 0, NETCOIN: 0};
    this.createStatus = 0;
    ApiConnector.createUser( 
      {
        username: this.username,
        name: this.name,
        password: this.password
      }, 
      (err, data) => {
        console.log(`creating user ${this.username}... error ${err}, ${data}`);
        if(!err) {
          this.createStatus = 1;
        }
       }
     );    
  }
  
  login() {
    ApiConnector.performLogin(
      {
        username: this.username,
        password: this.password
      },
      (err, data) => {
        console.log(`logging on ${this.username}... error ${err}, ${data}`);
       }
     );
   }
   
   addMoney( { currency, amount }, callback) {
        return ApiConnector.addMoney({ currency, amount }, (err, data) => {
            console.log(`Adding ${amount} of ${currency} to ${this.username}`);
            callback(err, data);
        });
    }

}
const Ivan = new Profile({
                  username: 'ivan',
                  name: { firstName: 'Ivan', lastName: 'Chernyshev' },
                  password: 'ivanspass'
              });

//function catchError ( err, data ) {
//  console.log(err, data);
//}

//const err1 = () => catchError(1,'asd');

//console.log('Created profile:',Ivan);
//console.log(err1());


const Petr = new Profile({
                  username: 'petr',
                  name: { firstName: 'Petr', lastName: 'Petroff' },
                  password: 'petrpass'
              });

/*
ApiConnector.createUser( 
      {
                  username: 'ivan3',
                  name: { firstName: 'Ivan', lastName: 'Chernyshev' },
                  password: 'ivanspass'
      }, 
      (err, data) => {
        console.log(`creating user 'ivan3'... error ${err}, ${data}`);
        return data;
       }
     );
*/

//setTimeout(Ivan.login,5000);

/*
Ivan.login();
     
Ivan.addMoney(
  {
    currency: 'USD',
    amount: 1000
  }, 
  ( err, data ) => {console.log(err, data)}
);
*/