var Election = artifacts.require("./Election.sol"); // We are storing an artefact that represents the Election smart contract so that it can be deployed to the blockchain network

module.exports = function (deployer) {
  deployer.deploy(Election);
};
