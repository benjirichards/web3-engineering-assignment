var chalk = require('chalk');
var clear = require('clear');
var figlet = require('figlet');
var inquirer = require('inquirer');
var Web3 = require('web3');

var abi = require('./build/contracts/CommitReveal.json').abi;

if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

var contractAddress = 'PUT CONTRACT ADDRESS HERE';

var votingContract = new web3.eth.Contract(abi, contractAddress);
var address;
web3.eth.getAccounts()
  .then((result) => {
    address = result[0];
  })
  .catch((error) => {
    console.log('Woops! Error getting accounts', error);
  });


setInterval(() => {
  //Get the length of the vote in seconds
  votingContract.methods.commitPhaseEndTime().call()
    .then((result) => {

      //calculate the remaining time if any
      var secondsLeft = result - (new Date().getTime() / 1000);

      //clears the console
      clear();

      //Pure vanity
      console.log(
        chalk.yellow(
          figlet.textSync('Vote:', { horizontalLayout: 'full' })
        )
      );

      //If in voting phase
      if (secondsLeft >= 0) {
        console.log(chalk.green('Voting is open with ', secondsLeft, ' seconds left.'));

        //ask for the users vote
        inquirer.prompt([
          {
            name: 'vote',
            type: 'list',
            message: 'What is your vote?',
            choices: ['0x59455300000000000000000000000000', '0x59455300000000000000000000000000'],
          }]).then((answers) => {
            console.log(`\nYou have voted ${answers.vote}\n`);
            
            //Send votes to the contract
            //This is where I was running out of time.
            //Was stuck with a out of gas error.
            votingContract.methods.commitVote(answers.vote).send({ 
              from: address,
            })
              .then((result) => {
                console.log('result for sending vote ===', result);
              })
              .catch((error) => {
                console.log('error ===', error)
              });
          });


      } else { //Revealing or revealed phases
        votingContract.methods.getWinner().call()
          .then((result) => {
            if (result != 'It was a tie!') {
              console.log('Voting is complete and all votes have been revealed. The winner is: ', result);
            } else {
              console.log('Voting is complete and all votes have been revealed. ', result);

              inquirer.prompt([
                {
                  name: 'vote',
                  type: 'input',
                  message: 'What is your vote?',
                },
                {
                  name: 'voteCommit',
                  type: 'input',
                  message: 'What is your vote commit?',
                },
              ]).then((answers) => {
                  votingContract.methods.revealVote(answers.vote, answers.voteCommit).send({from: address})
                    .then((result) => {
                      console.log('result for revealing vote ===', result);
                    })
                    .catch((error) => {
                      console.log('error ===', error)
                    });
                });
            };
          })
          .catch(() => {
            console.log('The votes are still being revealed.')
          });
      }

    })
    .catch((error) => {
      console.log('error =====', error);
    });
}, 8000);
//Can stop checking when the polls are closed with: clearInterval()