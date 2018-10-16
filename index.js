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

var contractAddress = '0x04e3e9f66b9c2a2939d1f33ed97e13d38e436908';

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
  votingContract.methods.commitPhaseEndTime().call()
    .then((result) => {

      var secondsLeft = result - (new Date().getTime() / 1000);

      clear();//clears the console
      console.log(
        chalk.yellow(
          figlet.textSync('Vote:', { horizontalLayout: 'full' })
        )
      );

      if (secondsLeft >= 0) { //Voting phase
        console.log(chalk.green('Voting is open with ', secondsLeft, ' seconds left.'));


        //***SHOW HOW MANY VOTES HAVE BEEN CAST and ?the winner of the vote if any?



        inquirer.prompt([
          {
            name: 'vote',
            type: 'list',
            message: 'What is your vote?',
            choices: ['0x59455300000000000000000000000000', '0x59455300000000000000000000000000'],
          }]).then((answers) => {
            console.log(`\nYou have voted ${answers.vote}\n`);
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

            }
          })
          .catch(() => {
            console.log('The votes are still being revealed.')
          });
      }

    })
    .catch((error) => {
      console.log('error =====', error);
    });
}, 4000);
//Can stop checking when the polls are closed with: clearInterval()

//Finds how many votes were cast
var printVoteQuantity = () => {
  votingContract.methods.numberOfVotesCast().call()
    .then((result) => {
      console.log('Vote quantity: ', result);
    })
    .catch((error) => {
      console.log('error =====>', error);
    });
};

//Find if votes are all revealed
var votesAllRevealed = () => {
  votingContract.methods.getWinner().call()
    .then((result) => {
      return result;
    })
    .catch((error) => {
      return false;
    });
};

// const myFunc = async () => {
//     try {
//         const myAccounts = await web3.eth.getAccounts();
//         console.log(myAccounts)
//         return myAccounts;

//     } catch (err) {
//         console.log(err);
//     }
// }

// myFunc()

console.log(chalk.red('voting contract <======'));
