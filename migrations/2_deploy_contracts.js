var WigoToken = artifacts.require("./WigoToken.sol");
var WigoTokenSale = artifacts.require("./WigoTokenSale.sol");

module.exports = function(deployer) {
  deployer.deploy(WigoToken, 1000000).then(function() {
    // Token price is 0.001 Ether
    var tokenPrice = 1000000000000000;
    return deployer.deploy(WigoTokenSale, WigoToken.address, tokenPrice);
  });
};
