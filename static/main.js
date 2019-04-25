"use strict";

class Stock {
  constructor() {
    this.rates = {};
  }
  
  getRates() {
    let err, data;
    ApiConnector.getStocks(
      ( err, data ) => 
      { 
        this.rates = data[data.length - 1];
      }
    );
  }
}

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
    
   convertMoney ({ fromCurrency, targetCurrency, sourceAmount }, callback) {
      if (this.loiginStatus != 1) {
        this.login();
      }
      if (this.loiginStatus != 1) {
        console.log (`User '${this.username}' has not beet created yet, unable to add money`);
        return this;
      } else {
      
        myStock.getRates();
        let workRate;
        //console.log(`Exchange rates:`);
        for (var prop in myStock.rates) {
          //console.log(prop, myStock.rates[prop]);
          if(prop ==  fromCurrency + '_' + targetCurrency) {
             workRate = myStock.rates[prop];
             //console.log(`*** Current Rate = ${prop}: ${workRate} ***`);
          }
        }
        const targetAmount =  sourceAmount * workRate;
        const obj = ApiConnector.convertMoney({ fromCurrency, targetCurrency, targetAmount: targetAmount }, 
        (err, data) => 
        {
          console.log(`Currency exchange ${fromCurrency} ${sourceAmount} to ${targetCurrency} ${targetAmount} for ${this.username}, exchange rate is ${workRate}`);
          callback(err, data, this);
        }); 
        return obj;
      }
   }
   
   transferMoney({ to, amount }, callback) {
      if (this.loiginStatus != 1) {
        this.login();
      }
      if (this.loiginStatus != 1) {
        console.log (`User '${this.username}' has not beet created yet, unable to add money`);
        return this;
      } else {
        const obj = ApiConnector.transferMoney({ to, amount }, 
        (err, data) => 
        {
          console.log(`Transfer ${amount} tokens to ${to} from ${this.username}`);
          callback(err, data, this);
        }
        );
      }
   }
}

const myStock = new Stock();
myStock.getRates();

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


function step01() {
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
    timerId = setTimeout(step02, 5000);
  };
};

function step02() {
  if(Ivan.createStatus == 1 && Ivan.loiginStatus == 0) {
    Ivan.login();
    return;
  };
  if(Ivan.loiginStatus == 1) {
    Ivan.convertMoney(
      {
        fromCurrency: 'USD',
        targetCurrency: 'NETCOIN',
        sourceAmount: 500
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

function step03() {
  if(Ivan.createStatus == 1 && Ivan.loiginStatus == 0) {
    Ivan.login();
    return;
  };
  if(Ivan.loiginStatus == 1) {
  
    Ivan.transferMoney(
      {
        to: Petr,
        amount: 10
      }, 
      ( err, data ) => 
      {
        console.log(data);
      }
      
      );
  
  };
}


let timerId = setInterval(step01, 5000);


   