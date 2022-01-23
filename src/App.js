import React from "react";
import styled from 'styled-components';
import './App.css';
import { Input } from "@chakra-ui/react";
const SHA256 = require('crypto-js/sha256');
const secp = require("@noble/secp256k1");
var Buffer = require('buffer/').Buffer; // note: the trailing slash is important!

const Div24Height = styled.div`
  height: 24px;
`

export default function App() {
  const [balance, setBalance] = React.useState(0);
  const [publicKey1, setPublicKey1] = React.useState("");
  const [publicKey2, setPublicKey2] = React.useState("");
  const [publicKey3, setPublicKey3] = React.useState("");
  const [privateKey1, setPrivateKey1] = React.useState("");
  const [privateKey2, setPrivateKey2] = React.useState("");
  const [privateKey3, setPrivateKey3] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [recipient, setRecipient] = React.useState("");
  const [signature, setSignature] = React.useState("");
  const [balances, setBalances] = React.useState([]);

  React.useEffect(() => {
    setUpPublicPrivateKeys()
  }, []);

  const setUpPublicPrivateKeys = () => {
    let privateKey1 = secp.utils.randomPrivateKey();
    let privateKey2 = secp.utils.randomPrivateKey();
    let privateKey3 = secp.utils.randomPrivateKey();

    privateKey1 = Buffer.from(privateKey1).toString('hex');
    privateKey2 = Buffer.from(privateKey2).toString('hex');
    privateKey3 = Buffer.from(privateKey3).toString('hex');

    setPrivateKey1(privateKey1);
    setPrivateKey2(privateKey2);
    setPrivateKey3(privateKey3);
    
    let public1 = Buffer.from(secp.getPublicKey(privateKey1)).toString('hex');
    public1 = "0x" + public1.slice(public1.length - 40);
    setPublicKey1(public1)
    let public2 = Buffer.from(secp.getPublicKey(privateKey2)).toString('hex');
    public2 = "0x" + public2.slice(public2.length - 40);
    setPublicKey2(public2)
    let public3 = Buffer.from(secp.getPublicKey(privateKey3)).toString('hex');
    public3 = "0x" + public3.slice(public3.length - 40);
    setPublicKey3(public3)

    const balances = {
      [public1]: 130,
      [public2]: 1040,
      [public3]: 100,
    }

    setBalances(balances);
  }

  function checkBalances(address) {
    if(!address) {
      setBalance(0);
    } else {
      if(!balances[address]) {
        setBalance(0);
      } else {
        setBalance(balances[address]);
      }
    }
  }

  function transferFunds() {
    const message = JSON.stringify({
      to: recipient,
      amount: parseInt(amount)
    });

    // hash the independent message
    const messageHash = SHA256(message).toString();

    console.log("message Hash: " + messageHash);

    let senderPublicKey;

    // recover the public key (just like Ethereum does it) using msgHash, sig, recoveryBit
    const recoveredPublicKey1 = Buffer.from(secp.recoverPublicKey(messageHash, signature, 0)).toString('hex');

    // recover the public key (just like Ethereum does it) using msgHash, sig, recoveryBit
    const recoveredPublicKey2 = Buffer.from(secp.recoverPublicKey(messageHash, signature, 1)).toString('hex');

    // clean up recovered public key so that we can look up if it matches our own server records
    const senderPublicKey1 = "0x" + recoveredPublicKey1.slice(recoveredPublicKey1.length - 40);

    // clean up recovered public key so that we can look up if it matches our own server records
    const senderPublicKey2 = "0x" + recoveredPublicKey2.slice(recoveredPublicKey2.length - 40);

    let publicKeyMatch = true;
    let recoveredPublicKey;

    // if recoverPublicKey() returns correct public key contained in db, else mark false
    if(!balances[senderPublicKey1] && !balances[senderPublicKey2]) {
      console.error("Public key does not match! Make sure you are passing in the correct values!");
      publicKeyMatch = false;
    } else if (!balances[senderPublicKey1] && balances[senderPublicKey2]) {
      senderPublicKey = senderPublicKey2;
      recoveredPublicKey = recoveredPublicKey2;
    } else if (!balances[senderPublicKey2] && balances[senderPublicKey1]) {
      senderPublicKey = senderPublicKey1;
      recoveredPublicKey = recoveredPublicKey1;
    }
    

    console.log(senderPublicKey + " is attempting to send " + amount + " to " + recipient);

    // verify signature using independent message hash, sig, recoveredPublicKey
    const isSigned = secp.verify(signature, messageHash, recoveredPublicKey);

    console.log(isSigned);

    // only if isSigned passes, allow transfer of funds
    // this means whoever sent the signature, owns the privkey associated to the funds
    if(isSigned && publicKeyMatch) {
      balances[senderPublicKey] -= amount;
      balances[recipient] = (balances[recipient] || 0) + +amount;
      console.log(senderPublicKey + " has successfully sent " + amount + " to " + recipient);
      checkBalances(senderPublicKey);
    } else {
      console.error("Something seems off! Make sure you are passing in the correct values!");
    }
  }
  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header-big">
          Public Key Exchange Project
        </div>
        <div className="sub-header">
          <div className="key-pair">
            <b>Public Key #1:</b> {publicKey1}
              <br></br>
            <b>Private Key #1:</b> {privateKey1}
              <br></br>
            <b>Balance:</b> {balances[publicKey1]}
          </div>
          <div className="key-pair">
            <b>Public Key #2:</b> {publicKey2}
              <br></br>
            <b>Private Key #2:</b> {privateKey2}
              <br></br>
            <b>Balance:</b> {balances[publicKey2]}
          </div>
          <div className="key-pair">
            <b>Public Key #3:</b> {publicKey3}
              <br></br>
            <b>Private Key #3:</b> {privateKey3}
              <br></br>
            <b>Balance:</b> {balances[publicKey3]}
          </div>  
        </div>

        <div className="split-section">
          <div className="left-untitled">
              <div className="header">
                Send Funds
              </div>
            <div className="left-section">
              <Input placeholder="Amount" fontSize='16px' padding='12px' width='16.5rem' size="lg" onChange={e => setAmount(e.target.value)}/>
                <Div24Height />
              <Input placeholder="Recipient" fontSize='16px' padding='12px' width='16.5rem' size="lg" onChange={e => setRecipient(e.target.value)}/>
                <Div24Height />
              <Input placeholder="Digital Signature" fontSize='16px' padding='12px' width='16.5rem' size="lg" onChange={e => setSignature(e.target.value)}/>
              <button className="button" onClick={transferFunds}>
                Transfer
              </button>
            </div>
          </div>
          <div className="right-untitled">
              <div className="header">
                My Wallet
              </div>
            <div className="right-section">
              <Input placeholder="Your Address" fontSize='24px' padding='12px' width='26.5rem' size="lg" onChange={e => checkBalances(e.target.value)}/>
              <div className="balance">
                Balance: {balance}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>   
  );
}