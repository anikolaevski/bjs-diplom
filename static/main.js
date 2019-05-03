// function getRates() {
//   var err, data;
//   var xxx = '111';
//   const myCallback = (x,y) => { err = x; data = y; /* console.log(err,data);*/ xxx = y;  };
//   const rates = (callback) => ApiConnector.getStocks(callback);
//   //   ( err1, data1 ) => {
//   //     // err = err1;
//   //     // data = data1[data.length - 1];
//   //      return data1[data.length - 1]; }
//   // );
//   rates(myCallback);
//   console.log(xxx);
//   // console.log(err, data);
//   if(!err) { return data; }
// }

class Stock {
  constructor() {
    this.rates = {};
    this.prevrates = {};
    this.bestrates = {};
    this.time = Date.now();
  }

  getRates() {
    let err, data, state = 1;
    ApiConnector.getStocks(
      ( err, data ) =>
      {
        this.prevrates = this.rates;
        this.rates = data[data.length - 1];
        this.time = Date.now();
        for (var prop in this.rates) {
          if(typeof(this.bestrates[prop]) == 'undefined') {
            this.bestrates[prop] = this.rates[prop];
            this.prevrates[prop] = this.rates[prop];
          } else {
            this.bestrates[prop] = Math.max( this.rates[prop], this.bestrates[prop] );
            this.bestrates[prop] += '';
          }
        }
      }
    );
  }

  checkFresh() {
    for (var prop in this.rates) {
      if(this.prevrates[prop] != this.rates[prop]) {
        return 1;
      }
    }
    return 0;
  }

}

class Profile {

  constructor (data) {
    this.username = data.username;
    this.name = data.name;
    this.password = data.password;
    this.wallet = {RUB: 0, USD: 0, EUR: 0, NETCOIN: 0};
    this.locks = {RUB: 0, USD: 0, EUR: 0, NETCOIN: 0};
    this.createStatus = 0;
    this.loiginStatus = 0;

    ApiConnector.createUser(
      {
        username: this.username,
        name: this.name,
        password: this.password
      },
      (err, data) => {
        if(!err) {
          console.log(`User ${this.username} created`);
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
        if(!err) {
          this.loiginStatus = 1;
          console.log(`User ${this.username} logged on`);
        }
       }
     );
   }

   isLockedCurrency(currency) {
     return this.locks[currency];
   }

   lockCurrency(currency) {
     this.locks[currency] = 1;
   }

   unlockCurrency(currency) {
     this.locks[currency] = 0;
   }

   addMoney( { currency, amount } ) {
      if (this.loiginStatus != 1) {
        this.login();
      }
      if (this.loiginStatus != 1) {
        console.log (`User '${this.username}' has not beet created yet, unable to add money`);
        return this;
      } else {
            ApiConnector.addMoney({ currency, amount }, (err, data) => {
            console.log(`Adding ${amount} of ${currency} to ${this.username}`);
            if(!err) {
              this.wallet[currency] = data.wallet[currency];
            }
        });
      }
    }

    convertMoney ({ fromCurrency, targetCurrency, sourceAmount }) {
      let exchTimerId, exchTimeout = 123;
      const from_Currency = {fromCurrency, targetCurrency, sourceAmount }['fromCurrency'];
      const target_Currency = {fromCurrency, targetCurrency, sourceAmount }['targetCurrency'];
      switch (from_Currency)  {
        case 'USD':
          exchTimeout = 100;
          break;
        case 'EUR':
            exchTimeout = 537;
            break;
        case 'RUB':
          exchTimeout = 317;
          break;
        default:
          exchTimeout = 137;
          alert ('Wrong currency!');
      }
      const checkExchState = () => {
        if (this.doConvertMoney ({ fromCurrency, targetCurrency, sourceAmount }) == 1) {
          clearTimeout(exchTimerId);
          this.unlockCurrency(from_Currency);
          this.unlockCurrency(target_Currency);
        };
      };
      console.log(`Wait timeout for ${from_Currency} is ${exchTimeout}`);
      exchTimerId = setInterval(checkExchState, exchTimeout);
    }

    doConvertMoney ({ fromCurrency, targetCurrency, sourceAmount }) /*, callback)*/ {
      if (this.loiginStatus != 1) {
        this.login();
      }
      if (this.loiginStatus != 1) {
        console.log (`User '${this.username}' has not beet created yet, unable to add money`);
        return this;
      } else {
        let workRate, bestWorkRate;
        for (var prop in myStock.rates) {
          if(prop ==  fromCurrency + '_' + targetCurrency) {
            workRate = myStock.rates[prop];
            bestWorkRate = myStock.bestrates[prop];
          }
        }
        // check money in user wallet
        if(this.wallet[fromCurrency] < sourceAmount) {
          console.log(`Not enough money on user account: ${this.wallet[fromCurrency]}, needed ${sourceAmount}`);
          return 0;
        }
        // check exchange rate
        if(workRate < bestWorkRate * 0.75) {
          console.log(`Waiting for good exchange rate ${fromCurrency} to ${targetCurrency}, current rate is ${workRate}, best rate is ${bestWorkRate}`);
          return 0;
        }
        if(this.isLockedCurrency(fromCurrency)) {
          console.log(`Waiting for unlock if currency ${fromCurrency} in the wallet`);
          return 0;
        }
        if(this.isLockedCurrency(targetCurrency)) {
          console.log(`Waiting for unlock if currency ${targetCurrency} in the wallet`);
          return 0;
        }

        // perform exchange
        const targetAmount =  sourceAmount * workRate;
        this.lockCurrency(fromCurrency);
        this.lockCurrency(targetCurrency);
        const obj = ApiConnector.convertMoney(
          { fromCurrency, targetCurrency, targetAmount: targetAmount },
          (err, data) =>
          {
            console.log(`Currency exchange ${fromCurrency} ${sourceAmount}
            to ${targetCurrency} ${targetAmount}
            for ${this.username}, exchange rate is ${workRate}`);
            // callback(err, data, this);
            if(!err) {
              this.wallet[targetCurrency] = data.wallet[targetCurrency];
              this.wallet[fromCurrency] = data.wallet[fromCurrency];
            }
          }
        );
        return 1;
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
        const obj = ApiConnector.transferMoney(
          { to, amount },
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
const stockQuery = () => { myStock.getRates() };
setInterval(stockQuery,300);

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
      }
    );
    Ivan.addMoney(
      {
        currency: 'EUR',
        amount: 500000
      }
    );
    Ivan.addMoney(
      {
        currency: 'RUB',
        amount: 1000000
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
  // if(Ivan.loiginStatus == 1) {
    Ivan.convertMoney(
      {
        fromCurrency: 'USD',
        targetCurrency: 'NETCOIN',
        sourceAmount: 1000
      }
    );
    Ivan.convertMoney(
      {
        fromCurrency: 'EUR',
        targetCurrency: 'NETCOIN',
        sourceAmount: 500000
      }
    );
    Ivan.convertMoney(
      {
        fromCurrency: 'RUB',
        targetCurrency: 'NETCOIN',
        sourceAmount: 1000000
      }
    );
    clearTimeout(timerId);
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


let timerId = setInterval(step01, 1000);
// console.log(Ivan.wallet);
// console.log(Ivan.convertMoney(
//   {
//     fromCurrency: 'EUR',
//     targetCurrency: 'NETCOIN',
//     sourceAmount: 500000
//   }
// ));
// console.log(Ivan.wallet);
