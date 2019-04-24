"use strict";
class Profile {

  constructor (data) {
    this.username = data.username;
    this.name = data.name;
    this.password = data.password;
    this.wallet = {RUB: 0, USD: 0, EUR: 0, NETCOIN: 0};
    this.createStatus = 0;
    this.loiginStatus = 0;
    
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
    if (this.createStatus != 1) {
      console.log (`User '${this.username}' has not beet created yet, unable to login`);
      return;
    }
    ApiConnector.performLogin(
      {
        username: this.username,
        password: this.password
      },
      (err, data) => {
        console.log(`logging on ${this.username}... error ${err}, ${data}`);
        if(!err) {
          this.loiginStatus = 1;
        }
       }
     );
   }
   
   addMoney( { currency, amount }, callback) {
        if (this.loiginStatus != 1) {
          this.login();
        }
        if (this.loiginStatus != 1) {
          console.log (`User '${this.username}' has not beet created yet, unable to add money`);
          return this;
        } else {
          const obj = ApiConnector.addMoney({ currency, amount }, (err, data) => {
              console.log(`Adding ${amount} of ${currency} to ${this.username}`);
              callback(err, data);
          });
 //         if(obj) {
 //           this.wallet[currency] = obj.wallet[currency];
 //         }
          return obj;
        }
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


Ivan.login();

Ivan.addMoney(
  {
    currency: 'USD',
    amount: 1000
  }, 
  ( err, data ) => {
    console.log(111, err, data);
    //if(!err) {
    console.log(112, data[wallet], arguments);
    //}
  }
);

/*
     
*/