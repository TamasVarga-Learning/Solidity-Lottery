const HDWalletProvider = require("truffle-hdwallet-provider");
const Web3 = require("web3");
const { interface, bytecode } = require("./compile");

const provider = new HDWalletProvider(
  // it should not be stored in code, but this is a test account without any real money
  'immense journey flavor success fabric mammal clinic crater cook regular abandon south',
  // rinkeby endpoint url from infura.io
  'https://rinkeby.infura.io/v3/26d4ff93d63b4d469dd1189ab5821f64'
);
const web3 = new Web3(provider);

// creating a function to be able to use async-await syntax
const deploy = async () => {
  const accounts = await web3.eth.getAccounts();

  console.log('Attempting to deploy from account', accounts[0]);

  const result = await new web3.eth.Contract(JSON.parse(interface)) // instantiate contract with ABI
      .deploy({ data: bytecode }) 
      .send({ from: accounts[0], gas: '1000000', gasPrice: '5000000000' }); // send a transaction that creates the contract on the network

  console.log('Contract deployed to', result.options.address);
};  

deploy();
