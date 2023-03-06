'use strict';

/////////////////////////////////////////////////
/////////////////////////////////////////////////
// BANKIST APP

// // Data
// const account1 = {
//   owner: 'Jonas Schmedtmann',
//   movements: [200, 450, -400, 3000, -650, -130, 70, 1300],
//   interestRate: 1.2, // %
//   pin: 1111,
// };

// const account2 = {
//   owner: 'Jessica Davis',
//   movements: [5000, 3400, -150, -790, -3210, -1000, 8500, -30],
//   interestRate: 1.5,
//   pin: 2222,
// };

// const account3 = {
//   owner: 'Steven Thomas Williams',
//   movements: [200, -200, 340, -300, -20, 50, 400, -460],
//   interestRate: 0.7,
//   pin: 3333,
// };

// const account4 = {
//   owner: 'Sarah Smith',
//   movements: [430, 1000, 700, 50, 90],
//   interestRate: 1,
//   pin: 4444,
// };

// const accounts = [account1, account2, account3, account4];

// Data 2

const account1 = {
  owner: 'Valentin Durci',
  movements: [200, 455.23, -306.5, 25000, -642.21, -133.9, 79.97, 1300],
  interestRate: 1.2, // %
  pin: 1111,

  movementsDates: [
    '2019-11-18T21:31:17.178Z',
    '2019-12-23T07:42:02.383Z',
    '2020-01-28T09:15:04.904Z',
    '2020-04-01T10:17:24.185Z',
    '2020-05-08T14:11:59.604Z',
    '2020-05-27T17:01:17.194Z',
    '2020-07-11T23:36:17.929Z',
    '2020-07-12T10:51:36.790Z',
  ],
  currency: 'EUR',
  locale: 'pt-PT', // de-DE
};

const account2 = {
  owner: 'Petar Petrovic',
  movements: [5000, 3400, -150, -790, -3210, -1000, 8500, -30],
  interestRate: 1.5,
  pin: 2222,

  // movementsDates: [
  //   '2022-12-20T13:15:33.035Z',
  //   '2022-12-19T09:48:16.867Z',
  //   '2022-12-18T06:04:23.907Z',
  //   '2022-12-13T14:18:46.235Z',
  //   '2022-12-12T16:33:06.386Z',
  //   '2022-11-14T14:43:26.374Z',
  //   '2020-06-25T18:49:59.371Z',
  //   '2020-07-26T12:01:20.894Z',
  // ],
  currency: 'USD',
  locale: 'en-US',
};

const accounts = [account1, account2];

// Elements
const labelWelcome = document.querySelector('.welcome');
const labelDate = document.querySelector('.date');
const labelBalance = document.querySelector('.balance__value');
const labelSumIn = document.querySelector('.summary__value--in');
const labelSumOut = document.querySelector('.summary__value--out');
const labelSumInterest = document.querySelector('.summary__value--interest');
const labelTimer = document.querySelector('.timer');

const containerApp = document.querySelector('.app');
const containerMovements = document.querySelector('.movements');

const btnLogin = document.querySelector('.login__btn');
const btnTransfer = document.querySelector('.form__btn--transfer');
const btnLoan = document.querySelector('.form__btn--loan');
const btnClose = document.querySelector('.form__btn--close');
const btnSort = document.querySelector('.btn--sort');

const inputLoginUsername = document.querySelector('.login__input--user');
const inputLoginPin = document.querySelector('.login__input--pin');
const inputTransferTo = document.querySelector('.form__input--to');
const inputTransferAmount = document.querySelector('.form__input--amount');
const inputLoanAmount = document.querySelector('.form__input--loan-amount');
const inputCloseUsername = document.querySelector('.form__input--user');
const inputClosePin = document.querySelector('.form__input--pin');

/////////////////////////////////////////////////
/////////////////////////////////////////////////
// LECTURES

const currencies = new Map([
  ['USD', 'United States dollar'],
  ['EUR', 'Euro'],
  ['GBP', 'Pound sterling'],
]);

const movements = [200, 450, -400, 3000, -650, -130, 70, 1300];

let currentAccount;
let shouldSort;
let runningTimer;

/**
 * Current USD to EUR rate
 */
const USDRate = 0.94;

/**
 * The function converts USD to EUR and vice versa using the current rate USD/EUR
 * @param {String} currency Currency that needs to be converted 'EUR' or 'USD'
 * @param {Number} amount
 * @param {Number} [rate=USDrate] USD to EUR rate
 * @returns {Number} Converted value
 */

const converter = function (currency, amount, rate = USDRate) {
  if (currency === 'EUR')
    return amount * Number.parseFloat(`${(1 / rate).toFixed(2)}`);
  if (currency === 'USD') return amount * rate;
};

//Generate usernames

accounts.forEach(acc => {
  acc.username = acc.owner
    .toLowerCase()
    .split(' ')
    .map(name => name[0])
    .join('');
});

const clearFields = function (...fields) {
  fields.forEach(field => {
    field.value = '';
    field.blur();
  });
};

const generateDate = function (locale = 'de-DE', date = new Date()) {
  const daysPassed = Math.trunc((new Date() - date) / 86400000);
  if (daysPassed === 0) return 'Today';
  if (daysPassed === 1) return 'Yesterday';
  if (daysPassed > 1 && daysPassed < 7) return `${daysPassed} days ago`;
  if (daysPassed >= 7 && daysPassed < 10) return `A week ago`;
  return Intl.DateTimeFormat(locale).format(date);
};

const generateNumber = function (acc, number) {
  const options = {
    style: 'currency',
    currency: acc.currency,
  };
  return Intl.NumberFormat(acc.locale, options).format(number);
};
/**
 * Transfers money from one to another account
 * @param {Object} sendingAcc Account that's sending the money
 * @param {Object} recievingAcc Account that's recieving the money
 * @param {Number} amount Transfering amount
 */
const transferMoney = function (sendingAcc, recievingAcc, amount) {
  const transferDate = new Date().toISOString();

  // Update movements
  sendingAcc.movements.splice(0, 0, -amount);
  recievingAcc.movements.splice(
    0,
    0,
    sendingAcc.currency === recievingAcc.currency
      ? amount
      : converter(sendingAcc.currency, amount)
  );

  // Update dates
  sendingAcc.movementsDates.splice(0, 0, transferDate);
  recievingAcc.movementsDates.splice(0, 0, transferDate);
};

const startLogoutTimer = function () {
  let time = 300;
  const tick = function () {
    const min = `${Math.trunc(time / 60)}`.padStart(2, 0);
    const sec = `${time % 60}`.padStart(2, 0);
    labelTimer.textContent = `${min}:${sec}`;
    if (time === 0) {
      currentAccount = '';
      containerApp.style.opacity = 0;
      labelWelcome.textContent = `Log in to get started`;
      clearFields(
        inputTransferTo,
        inputTransferAmount,
        inputLoanAmount,
        inputCloseUsername,
        inputClosePin
      );
      clearInterval(timer);
    }
    time--;
  };

  tick();
  const timer = setInterval(tick, 1000);

  return timer;
};

const resetTimer = function () {
  clearInterval(runningTimer);
  runningTimer = startLogoutTimer();
};

const generateMovements = function (acc, sort = false) {
  containerMovements.innerHTML = '';

  let html = '';
  let sortedMovements;

  if (sort) {
    sortedMovements = acc.movements.slice().sort((a, b) => b - a);
    shouldSort = false;
  } else {
    sortedMovements = acc.movements;
    shouldSort = true;
  }

  sortedMovements.forEach((mov, i) => {
    const type = mov < 0 ? 'withdrawal' : 'deposit';

    ///////////////////////BUG//////////////////////////
    // dates are not going to be correct if the movements are sorted.
    // Probably the only fix is to rewrite the code so the movemens are objects
    // Masking the issue by hidding dates when sorted
    const movDate = new Date(acc.movementsDates[i]);
    ///////////////////////BUG//////////////////////////

    let markup = `
  <div class="movements__row">
    <div class="movements__type movements__type--${type}">${i + 1} ${type}</div>
    <div class="movements__date">${
      sort ? '' : generateDate(acc.locale, movDate)
    }</div>
    <div class="movements__value">${generateNumber(acc, Math.abs(mov))}</div>
  </div>
  `;
    html += markup;
  });
  containerMovements.insertAdjacentHTML('afterbegin', html);
};

const CalcDisplayBalance = function (acc) {
  acc.balance = acc.movements.reduce((sum, mov) => (sum += mov), 0);

  labelBalance.textContent = `${generateNumber(acc, acc.balance)}`;
};

const CalcDisplaySummary = function (acc) {
  const { deposits, withdrawals } = acc.movements.reduce(
    (sum, mov) => {
      sum[mov > 0 ? 'deposits' : 'withdrawals'] += Math.abs(mov);
      return sum;
    },
    { deposits: 0, withdrawals: 0 }
  );

  labelSumIn.textContent = `${generateNumber(acc, deposits)}`;
  labelSumOut.textContent = `${generateNumber(acc, withdrawals)}`;
  labelSumInterest.textContent = `${generateNumber(acc, deposits * 0.01)}`;
};

const updateUI = function (acc) {
  // Display date
  labelDate.textContent = generateDate(acc.locale);
  // Generate movements
  generateMovements(acc);
  // Calculate and display balance
  CalcDisplayBalance(acc);
  // Calculate and display summary
  CalcDisplaySummary(acc);
};

//Logging in

btnLogin.addEventListener('click', function (e) {
  e.preventDefault();
  currentAccount = accounts.find(
    acc => inputLoginUsername.value === acc.username
  );

  if (!currentAccount || +inputLoginPin.value !== currentAccount.pin) return;

  containerApp.style.opacity = 100;
  labelWelcome.textContent = `Welcome, ${currentAccount.owner.split(' ')[0]}!`;

  clearFields(inputLoginUsername, inputLoginPin);

  // Update UI

  updateUI(currentAccount);

  // Start loging out timer
  if (runningTimer) clearInterval(runningTimer);
  runningTimer = startLogoutTimer();
});

// Transfer money

btnTransfer.addEventListener('click', function (e) {
  e.preventDefault();
  let transferAmount = +inputTransferAmount.value;
  const transferTo = accounts.find(
    acc => inputTransferTo.value === acc.username
  );

  if (
    transferTo &&
    transferTo.username !== currentAccount.username &&
    transferAmount <= currentAccount.balance
  ) {
    transferMoney(currentAccount, transferTo, transferAmount);
    updateUI(currentAccount);
    clearFields(inputTransferTo, inputTransferAmount);
    resetTimer();
  }
});

// Request loan

btnLoan.addEventListener('click', function (e) {
  e.preventDefault();
  const requestedAmount = +inputLoanAmount.value;

  const requestDate = new Date().toISOString();

  const maxDeposit = currentAccount.movements.reduce(
    (max, cur) => (max < cur ? (max = cur) : max),
    0
  );
  if (
    requestedAmount &&
    requestedAmount > 0 &&
    requestedAmount * 0.1 <= maxDeposit
  ) {
    currentAccount.movements.splice(0, 0, requestedAmount);
    currentAccount.movementsDates.splice(0, 0, requestDate);

    updateUI(currentAccount);
    clearFields(inputLoanAmount);
    resetTimer();
  }
});

// Close account

btnClose.addEventListener('click', function (e) {
  e.preventDefault();
  if (
    inputCloseUsername.value === currentAccount.username &&
    +inputClosePin.value === currentAccount.pin
  ) {
    accounts.splice(accounts.indexOf(currentAccount), 1);

    clearFields(inputCloseUsername, inputClosePin);
    currentAccount = '';
    containerApp.style.opacity = 0;
  }
});

// Sort movements

btnSort.addEventListener('click', function () {
  generateMovements(currentAccount, shouldSort);
});
