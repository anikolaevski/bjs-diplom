class Stock {

  constructor() {
    this.rates = {};         // last extracted rates
    this.prevrates = {};     // previous extracted rates
    this.bestrates = {};     // best rates, obtained after number of runs
    this.surveyVolume = 0;
  }

  getRates() {
    let err, data, state = 1;
    ApiConnector.getStocks(
      ( err, data ) =>
      {
        this.prevrates = this.rates;
        this.rates = data[data.length - 1];
        for (var prop in this.rates) {
          if(typeof(this.bestrates[prop]) == 'undefined') {
            this.bestrates[prop] = this.rates[prop];
          } else {
            this.bestrates[prop] = Math.max( this.rates[prop], this.bestrates[prop] );
            this.bestrates[prop] += '';
          }
        }
        this.surveyVolume++;
      }
    );
  }

  getBestRates() {
    let err, data, state = 1;
    ApiConnector.getStocks(
      ( err, data ) =>
      {
        for (var prop in this.rates) {
          if(typeof(this.bestrates[prop]) == 'undefined') {
            this.bestrates[prop] = this.rates[prop];
          }
        };
        data.forEach( (rate) => {
          for (var prop in this.rates) {
              this.bestrates[prop] = Math.max( rate[prop], this.bestrates[prop] );
          }
        });
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
  }

  createUser() {
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
    let timerId;
    const doLogin = () => ApiConnector.performLogin(
      {
        username: this.username,
        password: this.password
      },
      (err, data) => {
        if(!err) {
          this.loiginStatus = 1;
          console.log(`User ${this.username} logged on`);
          clearTimeout(timerId);
        } else {
          console.log(`User ${this.username} waiting for login`);
        }
       }
     );
     timerId = setInterval(doLogin, 300);
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
            console.log(`Currency exchange ${fromCurrency} ${sourceAmount} to ${targetCurrency} ${targetAmount} for ${this.username}, exchange rate is ${workRate}`);
            if(!err) {
              this.wallet[targetCurrency] = data.wallet[targetCurrency];
              this.wallet[fromCurrency] = data.wallet[fromCurrency];
            }
          }
        );
        return 1;
      }
   }

   transferMoney({ to, amount } ) {
     // let result = 0;
      if (this.loiginStatus != 1) {
        this.login();
      }
      if(to.createStatus != 1) {
        console.log (`User '${to.username}' has not beet created yet, unable to add money`);
      }
      if (this.loiginStatus != 1) {
        console.log (`User '${this.username}' has not beet created yet, unable to send money`);
        return this;
      } else {
        const toName = to.username;
        console.log(`Transfer ${amount} tokens to ${toName} from ${this.username}`);
        ApiConnector.transferMoney(
          { to: toName, amount: amount },
          (err, data) => {
            if (!err) {
              this.wallet['NETCOIN'] = data.wallet['NETCOIN'];
            }
          }
        );
        to.wallet['NETCOIN'] += amount;
      }
   }
}

function main() {
  let myTimeout;
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

// Gathering best exchange rates, at 5th measurement start actions...
  const stockQuery = () => {
    myStock.getRates();
    if(myStock.surveyVolume <= 2 ) {
      myStock.getBestRates();
    }
    if(myStock.surveyVolume == 3 ) {
      myTimeout = setInterval(createuser, 500);
    }
  };
  let stockTimeout;

// Create 1st user
  const createuser = () => {
    if(Ivan.createStatus == 0) {
      Ivan.createUser();
    }
    if(Ivan.createStatus == 1) {
      clearTimeout(myTimeout);
      myTimeout = setInterval(loginuser, 500);
    };
    return Ivan.createStatus;
  };

  // login user
  const loginuser = () => {
    if(Ivan.loiginStatus == 0) {
      Ivan.login();
    }
    if(Ivan.loiginStatus == 1) {
      clearTimeout(myTimeout);
      myTimeout = setInterval(addMoney, 500);
    };
    return Ivan.loiginStatus;
  };

  // Adding money
  const addMoney = () => {
    const testCurrency = 'EUR';
    const testAmount = 500000;
    if(Ivan.wallet[testCurrency] == 0) {
      Ivan.addMoney(
        {
          currency: testCurrency,
          amount: testAmount
        }
      );
    }
    if(Ivan.wallet[testCurrency] == testAmount) {
      clearTimeout(myTimeout);
      myTimeout = setInterval(transMoney, 500);
    }
  }

  // transfer money to tokens
  const transMoney = () => {

    const transObject = {
      fromCurrency: 'EUR',
      targetCurrency: 'NETCOIN',
      sourceAmount: 500000
    };
    let status = 0;
    const targetCurrency = transObject['targetCurrency'];
    const sourceAmount = transObject['sourceAmount'];

    if(Ivan.wallet[targetCurrency] == 0) {
      status = Ivan.convertMoney( transObject );
    }
    if( status == 1) {
      clearTimeout(myTimeout);
      myTimeout = setInterval(creaSecondUser, 500);
    }
  }

  // create 2nd user
  const creaSecondUser = () => {
    if(Petr.createStatus == 0) {
      Petr.createUser();
    }
    // console.log(111, Ivan.createStatus, myTimeout);
    if(Petr.createStatus == 1) {
      clearTimeout(myTimeout);
      setTimeout(sendTokens, 500);
      // console.log(222, Ivan.createStatus, myTimeout);
    };
    return Petr.createStatus;
  };

  // transfer 1st user's tokens to 2nd user
  const sendTokens = () => {
    const transferAmount = Ivan.wallet['NETCOIN'];
    Ivan.transferMoney( { to: Petr, amount: transferAmount } );
    setTimeout(displayStatus, 500);
  };

  const displayStatus = () => {
    console.log(Ivan.username, Ivan.wallet);
    console.log(Petr.username, Petr.wallet);
  }

  console.log('Obtaining best Exchange rates...');
  stockTimeout = setInterval(stockQuery,300);
  // myTimeout = setInterval(createuser, 2000);
}

const myStock = new Stock();
main();
