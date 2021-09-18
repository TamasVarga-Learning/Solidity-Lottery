const assert = require('assert');
const { dir } = require('console');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider()); // instantiate Web3 class using local network
const { interface, bytecode } = require('../compile'); // properties of compile.js json result (interface: ABI, bytecode: compiled bytecode)

/*
STEPS
1. Mocha starts
2. Deploy a new contract (beforeEach)
3. Manipulate the contract (it)
4. Make an assertation (it)
*/

let lottery;
let accounts;

beforeEach(async () => {
    // Get a list of all accounts
    accounts = await web3.eth.getAccounts();
    
    // Use one of those accounts to deploy the contract
    lottery = await new web3.eth.Contract(JSON.parse(interface)) // instantiate contract with ABI
        .deploy({ data: bytecode }) 
        .send({ from: accounts[0], gas: '1000000'}); // send a transaction that creates the contract on the network
});

describe('Lottery', () => {
    it('deploys a contract', () => {        
        assert.ok(lottery.options.address);
    });

    it('initializes manager', async () => {
        const manager = await lottery.methods.manager().call(); // invoking message with call()
        assert.equal(manager, accounts[0]);
    });

    it('player can enter', async () => {
        await lottery.methods.enter().send({ 
            from: accounts[1], 
            value: web3.utils.toWei('0.011', 'ether'), 
            gas: '1000000' }); // invoking 'enter' method with send(transaction_object)

        const players = await lottery.methods.getPlayers().call();
        assert.equal(accounts[1], players[0]);
        assert.equal(1, players.length);
    });

    it('2 players can enter', async () => {
        await lottery.methods.enter().send({ 
            from: accounts[1], 
            value: web3.utils.toWei('0.011', 'ether'), 
            gas: '1000000' });

        await lottery.methods.enter().send({ 
            from: accounts[2], 
            value: web3.utils.toWei('0.011', 'ether'), 
            gas: '1000000' });

        const players = await lottery.methods.getPlayers().call();
        assert.equal(accounts[1], players[0]);
        assert.equal(accounts[2], players[1]);
        assert.equal(2, players.length);
    });

    it('requires a minimum amount of ether to enter', async () => {
        try {
            await lottery.methods.enter().send({ 
                from: accounts[1], 
                value: 1, 
                gas: '1000000' 
            });
            assert(false);
        }      
        catch (err) {
            assert(err);
        }        
    });

    it('not owner cant pick winner', async () => {
        try {
            await lottery.methods.pickWinner().send({ 
                from: accounts[1]
            });
            assert(false);
        }      
        catch (err) {
            assert(err);
        }        
    });

    it('sends money to the winner and resets players', async () => {
        await lottery.methods.enter().send({ 
            from: accounts[0], 
            value: web3.utils.toWei('1', 'ether'), 
            gas: '1000000' });

        const initialBalance = await web3.eth.getBalance(accounts[0]);

        await lottery.methods.pickWinner().send({ from: accounts[0] });

        const finalBalance = await web3.eth.getBalance(accounts[0]);

        const difference = finalBalance - initialBalance;        
        assert(difference > web3.utils.toWei('0.8', 'ether'));

        const players = await lottery.methods.getPlayers().call();
        assert.equal(0, players.length);
    });
});