"use strict";
class Profile {
  constructor (data) {
    this.username = data.username;
    this.name = data.name;
    this.password = data.password;
    this.authorized = false;
    this.balance = 0;
    ApiConnector.createUser( 
      {
        username: this.username,
        name: this.name,
        password: this.password
      }, 
      (err, data) => {
        console.log(`creating user ${this.username}... error ${err}, ${data}`);
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
}

const Ivan = new Profile({
                  username: 'ivan',
                  name: { firstName: 'Ivan', lastName: 'Chernyshev' },
                  password: 'ivanspass'
              });

function catchError ( err, data ) {
  console.log(err, data);
}

const err1 = () => catchError(1,'asd');

console.log(Ivan);
console.log(err1());

//setTimeout(Ivan.login,5000);
