App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  loading: false,
  tokenPrice: 1000000000000000,
  tokensSold: 0,
  tokensAvailable: 750000,

  init: function () {
    console.log('App initialized...');
    return App.initWeb3();
  },

  initWeb3: function () {
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider(
        'http://localhost:7545'
      );
      web3 = new Web3(App.web3Provider);
    }
    return App.initContracts();
  },

  connectAccount: function () {
    web3.currentProvider.enable().then(function (acc) {
      App.account = acc[0];
      $('#accountAddress').html('Your Account: ' + App.account);
    });
  },

  initContracts: function () {
    $.getJSON('WigoTokenSale.json', function (WigoTokenSale) {
      App.contracts.WigoTokenSale = TruffleContract(WigoTokenSale);
      App.contracts.WigoTokenSale.setProvider(App.web3Provider);
      App.contracts.WigoTokenSale.deployed().then(function (WigoTokenSale) {
        console.log('Wigo Token Sale Address:', WigoTokenSale.address);
      });
    }).done(function () {
      $.getJSON('WigoToken.json', function (WigoToken) {
        App.contracts.WigoToken = TruffleContract(WigoToken);
        App.contracts.WigoToken.setProvider(App.web3Provider);
        App.contracts.WigoToken.deployed().then(function (WigoToken) {
          console.log('Wigo Token Address:', WigoToken.address);
        });

        App.listenForEvents();
        return App.render();
      });
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function () {
    App.contracts.WigoTokenSale.deployed().then(function (instance) {
      instance
        .Sell(
          {},
          {
            fromBlock: 0,
            toBlock: 'latest',
          }
        )
        .then(function (error, event) {
          console.log('event triggered', event);
          App.render();
        });
      
      const allEvents = instance.allEvents({
        fromBlock: 0,
        toBlock: 'latest',
      });
      allEvents.watch((err, res) => {
        console.log(res);
      });
      // instance
      //   .Sell(
      //     {
      //       // filter: {
      //       //   myIndexedParam: [20, 23],
      //       //   myOtherIndexedParam: '0x123456789...',
      //       // }, // Using an array means OR: e.g. 20 or 23
      //       fromBlock: 0,
      //     },
      //     function (error, event) {
      //       console.log(event);
      //     }
      //   )
      //   .on('data', function (event) {
      //     console.log(event); // same results as the optional callback above
      //   })
        // .on('changed', function (event) {
        //   // remove event from local database
        // })
        // .on('error', console.error);
    });
  },

  render: function () {
    if (App.loading) {
      return;
    }
    App.loading = true;

    var loader = $('#loader');
    var content = $('#content');

    loader.show();
    content.hide();

    // loader.hide();
    // content.show();

    // Load account data
    web3.eth.getCoinbase(function (err, account) {
      if (err === null) {
        App.account = account;
        $('#accountAddress').html('Your Account: ' + account);
      }
    });

    // Load token sale contract
    App.contracts.WigoTokenSale.deployed().then(function(instance) {
      WigoTokenSaleInstance = instance;
      return WigoTokenSaleInstance.tokenPrice();
    }).then(function(tokenPrice) {
      App.tokenPrice = tokenPrice;
      const tokenPriceNumber = web3.utils
        .fromWei(App.tokenPrice, 'ether')
        // .toNumber();
      $('.token-price').html(tokenPriceNumber);
      return WigoTokenSaleInstance.tokensSold();
    }).then(function(tokensSold) {
      App.tokensSold = tokensSold.toNumber();
      $('.tokens-sold').html(App.tokensSold);
      $('.tokens-available').html(App.tokensAvailable);

      var progressPercent = (Math.ceil(App.tokensSold) / App.tokensAvailable) * 100;
      $('#progress').css('width', progressPercent + '%');

      // Load token contract
      App.contracts.WigoToken.deployed().then(function(instance) {
        WigoTokenInstance = instance;
        return WigoTokenInstance.balanceOf(App.account);
      }).then(function(balance) {
        $('.Wigo-balance').html(balance.toNumber());
        App.loading = false;
        loader.hide();
        content.show();
      })
    });
  },

  buyTokens: function () {
    $('#content').hide();
    $('#loader').show();
    var numberOfTokens = $('#numberOfTokens').val();
    App.contracts.WigoTokenSale.deployed()
      .then(function (instance) {
        return instance.buyTokens(numberOfTokens, {
          from: App.account,
          value: numberOfTokens * App.tokenPrice,
          gas: 500000, // Gas limit
        });
      })
      .then(function (result) {
        console.log('Tokens bought...');
        $('form').trigger('reset'); // reset number of tokens in form
        // Wait for Sell event
      });
  },
};

$(function() {
  $(window).load(function() {
    App.init();
  })
});

document.getElementById('conenct-meta').addEventListener('click', App.connectAccount)