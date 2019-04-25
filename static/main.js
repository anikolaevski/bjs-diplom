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
        console.log(`creating user ${this.username}...`);
        if(!err) {
        console.log(`... success ${data}`);
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
        console.log(`logging on ${this.username}...`);
        if(!err) {
          this.loiginStatus = 1;
          console.log(`... success ${data}`);
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
              callback(err, data, this);
          });
          return obj;
        }
    }

}

const Ivan = new Profile({
                  username: 'ivan',
                  name: { firstName: 'Ivan', lastName: 'Chernyshev' },
                  password: 'ivanspass'
              });

const Petr = new Profile({
                  username: 'petr',
                  name: { firstName: 'Petr', lastName: 'Petroff' },
                  password: 'petrpass'
              });

function main() {
  if(Ivan.createStatus == 1 && Ivan.loiginStatus == 0) {
    Ivan.login();
    return;
  };
  if(Ivan.loiginStatus == 1) {
    Ivan.addMoney(
      {
        currency: 'USD',
        amount: 1000
      }, 
      ( err, data, obj ) => {
        if(!err) {
          obj.wallet = data.wallet;
        }
      }
    );
    clearTimeout(timerId);
  };
};

let timerId = setInterval(main, 5000);


