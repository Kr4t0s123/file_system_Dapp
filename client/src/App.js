import React, { Component } from "react";
import SolidityDrive from "./contracts/SolidityDrive.json";
import { StyledDropZone } from 'react-drop-zone'
import  { FileIcon  , defaultStyles } from 'react-file-icon';
import { Table } from 'reactstrap'
import getWeb3 from "./getWeb3";
import ipfs from './ipfs'
import Moment from 'react-moment'
import "./App.css"
import "react-drop-zone/dist/styles.css"
import "bootstrap/dist/css/bootstrap.css"
const Buffer = require('buffer/').Buffer;


let type, name;

class App extends Component {
  state = { solidityDrive: [] , web3: null, accounts: null, contract: null };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = SolidityDrive.networks[networkId];
      const instance = new web3.eth.Contract(
        SolidityDrive.abi,
        deployedNetwork && deployedNetwork.address,
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance } , this.getFiles);
      window.ethereum.on("accountsChanged", async () => {
        // Time to reload your interface with accounts[0]!
        let updatedAccounts = await web3.eth.getAccounts();
        // accounts = await web3.eth.getAccounts();
        this.setState({ accounts : updatedAccounts  } )
        this.getFiles()
        console.log(accounts);
      })


      // web3.currentProvider.publicConfigStore.on('update', async () => {
      //   // Time to reload your interface with accounts[0]!
      //   let updatedAccounts = await web3.eth.getAccounts();
      //   this.setState({ accounts : updatedAccounts  } , this.getFiles())
       
      // });
     
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  captureFile = (file) => {
    let reader = new FileReader()
    type = file.name.substring(file.name.lastIndexOf(".")+1)
    name = file.name
    reader.onloadend = () => this.saveToIpfs(reader)
    reader.readAsArrayBuffer(file)
  }

  saveToIpfs =async (reader) => {
    try {
      const { accounts, contract} = this.state
      const buffer = Buffer.from(reader.result)

      const result = await ipfs.add(buffer)
      console.log(result)
      const timestamp =  Math.round(+new Date()/1000);
      const uploaded = await contract.methods.add(result.path ,name , type ,timestamp ).send({ from : accounts[0] , gas : 300000})
      console.log(uploaded)
      this.getFiles()
    } catch (error) {
      
    }
    
  }


  getFiles = async () =>{
      try {
        const { accounts, contract} = this.state
        let filesLength = await contract.methods.getLength().call({ from : accounts[0], gas : 300000 }) 
        let files = [];
        for(let i=0;i<filesLength;i++){
            let file = await contract.methods.getFile(i).call({ from : accounts[0], gas : 300000 })
            console.log(file)
            files.push(file)
        }
        this.setState({ solidityDrive : files })
      } catch (error) {
          console.log(error)
      }
  }

  // onDrop = async (file) =>{
  //     try {
  //       const { accounts , contract } = this.state
  //       const stream = fileReaderPullStream(file)
  //       const result = await ipfs.add(stream)
  //       console.log(result)
  //     } catch (error) {
  //       console.log(error)
  //     }
  // }
  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    const { solidityDrive } = this.state
    return (
      <div className='App'>
          <div className='container pt-3'>
              <StyledDropZone onDrop={this.captureFile}/>
              
              <Table className={{ color : 'grey'}}>
                  <thead>
                      <tr>
                         <th width='7%' scope='row'>Type</th>
                         <th className='text-left'>File Name</th>
                         <th className='text-right'>Date</th>
                      </tr>
                  </thead>
                  <tbody>
                    { solidityDrive !==[] ? (
                      solidityDrive.map((item ,i )=>(
                        <tr key={i}>
                            <th><div style={{ width : '30px' , margin : "auto"}} ><FileIcon size={30} extension={item[2]} {...defaultStyles[item[2]]} /></div></th>
                            <th className='text-left'> <a href={`https://ipfs.io/ipfs/${item[0]}`}>{item[1]}</a></th>
                            <th className='text-right'><Moment format="YYYY/MM/DD" unix>{item[3]}</Moment></th>
                        </tr>
                      )) 
                    ) : null}
                  </tbody>
              </Table>
          </div>
      </div>
     //
    );
  }
}

export default App;
