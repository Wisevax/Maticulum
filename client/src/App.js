import React, { Component } from "react";
import { BrowserRouter as Router, NavLink, Switch, Route } from 'react-router-dom';
import { Button, Nav, Navbar } from 'react-bootstrap';

import getWeb3 from "./getWeb3";
import Web3Context from "./Web3Context";
import config from './config';
import Maticulum from "./contracts/Maticulum.json";

import Home from './components/Home';
import Registration from './components/Registration';
import School from './components/school/School';
import Whitelisted from './components/Whitelisted';

import "./App.css";


class App extends Component {

  state = { storageValue: 0, web3: null, networkId: -1, accounts: null, contract: null,
  isRegistered:false, roleUser : null};


  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Maticulum.networks[networkId];
      const instance = new web3.eth.Contract(
        Maticulum.abi,
        deployedNetwork && deployedNetwork.address,
      );
	  
	  const isRegistered = await instance.methods.isRegistered().call({from: accounts[0]});
	  
	  let roleUser = -1;
	  
	  if(isRegistered){		  
		const user = await instance.methods.getUser().call({from: accounts[0]});
		roleUser = user[3];
	  }

      window.ethereum.on('accountsChanged', accounts => {
        console.log('Accounts changed ', accounts);
        this.setState({ accounts });
		this.registered(accounts);
      });

      window.ethereum.on('chainChanged', networkId => {
        console.log('Chain changed ', networkId);
        this.setState({ networkId: parseInt(networkId) });
      });

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, networkId, accounts, contract: instance, roleUser:roleUser,
	  isRegistered:isRegistered}, this.init);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };


  init = async () => {
    const { networkId, accounts, contract } = this.state;
		
    if (networkId !== config.NETWORK_ID) {
      return;
    }
  };


  ellipsis(s) {
    return s.substring(0, 6) + '...' + s.substring(s.length - 4, s.length);
  }


  connectPolygon = async () => {
    const { networkId, web3 } = this.state;

    if (networkId !== config.NETWORK_ID) {
      const data = [{
        chainId: config.CHAIN_ID,
        chainName: config.CHAIN_NAME,
        nativeCurrency: {
          name: config.CURRENCY_NAME,
          symbol: config.CURRENCY_SYMBOL,
          decimals: 18
        },
        rpcUrls: [ config.RPC_URL ],
        blockExplorerUrls: [ config.EXPLORER_URL ]
      }];
  
      await window.ethereum.request({ method: 'wallet_addEthereumChain', params: data });
    }
  }


  connectUser = async () => {
    await window.ethereum.enable();
  }
  
  registered = async (accounts) => {
	const { contract } = this.state;
	this.state.isRegistered = await contract.methods.isRegistered().call({from: accounts[0]});
	window.location.assign('/');		
  }


  render() {  
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }

    const { accounts, networkId } = this.state;
    const polygon = networkId === config.NETWORK_ID;
    const connected = accounts.length > 0;
	
	if(!this.state.isRegistered){
		return <div>Contact admin to be registered...</div>;
	}

    return (
      <Web3Context.Provider value={{
        web3: this.state.web3,
        contract: this.state.contract,
        account: this.state.accounts[0]
      }} >
        <Router>
          <Navbar>
            <Navbar.Brand href='/'>Maticulum</Navbar.Brand>
            <Navbar.Collapse>
              <Nav className='mr-auto'>
                <NavLink className="nav-link" exact to={'/'}>Accueil</NavLink>
				{ this.state.roleUser == 0 ? <Nav.Link visibility="hidden" href={'/whitelisted'}>Whitelisted</Nav.Link>	: null}			
                <NavLink className="nav-link" to={'/registration'}>Registration</NavLink>
                <NavLink className="nav-link" to={'/schools/list'}>Écoles</NavLink>
              </Nav>
            </Navbar.Collapse>
            <Navbar.Collapse className="justify-content-end">
                <Button { ...polygon ? {} : {href: '#'}} variant={ polygon ? "outline-info" : "outline-danger" } onClick={this.connectPolygon} >
                  { polygon ? config.NETWORK_NAME : 'Réseau non supporté' }
                </Button>
                <Button { ...connected ? {} : {href: '#'}} className="next" variant="outline-primary" onClick={this.connectUser}>
                  { connected ? this.ellipsis(accounts[0]) : 'Connection' }
                </Button>
            </Navbar.Collapse>
          </Navbar>

          <div className="main">
            <Switch>
              <Route exact path='/' component={Home} />
			  <Route exact path='/whitelisted'>	
				<Whitelisted web3={this.state.web3} account={this.state.accounts[0]} />
			 </Route>
              <Route exact path='/registration'>	
                <Registration />
              </Route>
              <Route path='/schools'>
                  <School />
              </Route>
            </Switch>
          </div>
        </Router>
      </Web3Context.Provider>
    );
  }
}

export default App;
