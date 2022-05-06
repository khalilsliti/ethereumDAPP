App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,

  init: function() {      // initializing the applcation using web3
    return App.initWeb3();
  },

  initWeb3: function() {      //from a high level this function permits us to connect our client side to the local blockchain
    // We will get a web instance attached to our window from metamask
    if (typeof web3 !== 'undefined') {

      // If a web3 instance is already provided by Meta Mask  (Meta Mask is the extension that turns our browser to a blockchain browser).
      App.web3Provider = web3.currentProvider;  // when we login to metamask we will have a web3 provider (attribute from web3 instance)
      //                                          So we need to set our application web3provider to the web3provider returner by the metamask 
      web3 = new Web3(web3.currentProvider);    
    } else {
      // Specify default web3  instance if no web3 instance provided by metamask 
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545'); //we set a default web3 provider from our local blockchain instance
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function() {  //this function loads up our contract to our frontend so that we can interact with it
    $.getJSON("Election.json", function(election) {   //election variable contains the returned json from the file and we use this json to
      //                                                Instantiate a new truffle contract from the artifact
      //getJson method works because we are using the browser sync package in the file bs-config.json
      App.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);

      App.listenForEvents();

      return App.render();
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.Election.deployed().then(function(instance) {
      
      instance.votedEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)
        // Reload when a new vote is recorded
        App.render();
      });
    });
  },

  render: function() {
    var electionInstance;
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    // Load account data  getCoinBase method enable us to fetch the account that we are currently connected with to the blockchain network
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    // Load contract data  
    //We will list the candidates for the e-voting applicaiton 
    App.contracts.Election.deployed().then(function(instance) { // we need to get an instance of our contract 
      electionInstance = instance;
      return electionInstance.candidatesCount();
    }).then(function(candidatesCount) {
      var candidatesResults = $("#candidatesResults");
      candidatesResults.empty();

      var candidatesSelect = $('#candidatesSelect');
      candidatesSelect.empty();

      for (var i = 1; i <= candidatesCount; i++) {  // displaying the candidates
        electionInstance.candidates(i).then(function(candidate) {
          var id = candidate[0];
          var name = candidate[1];
          var voteCount = candidate[2];

          // Render candidate Result
          var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
          candidatesResults.append(candidateTemplate);

          // Render candidate ballot option
          var candidateOption = "<option value='" + id + "' >" + name + "</ option>"
          candidatesSelect.append(candidateOption);
        });
      }
      return electionInstance.voters(App.account);
    }).then(function(hasVoted) {
      // Do not allow a user to vote
      if(hasVoted) {     // if the current acocunt voted we must hide the form
        $('form').hide();
      }
      loader.hide();
      content.show();
    }).catch(function(error) {
      console.warn(error);
    });
  },

  castVote: function() {
    var candidateId = $('#candidatesSelect').val();
    App.contracts.Election.deployed().then(function(instance) {
      return instance.vote(candidateId, { from: App.account });  // the vote has been casted fro mthe current account
    }).then(function(result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
