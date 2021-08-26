import React, {useState, useEffect} from "react";
import {ethers} from 'ethers'
import axios from "axios";

import ConnectWeb3 from './components/connect-web3'
import KoChildERC721MintableTokenContractAbi from './contract/KoChildERC721MintableToken.json'

import './App.css'

function App() {

  const [contract, setContract] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [uri, setUri] = useState("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [balance, setBalance] = useState(0);
  const [listNft, setListNft] = useState();
 
  /**
   * When contract
   */
  useEffect(() => {
    if (contract && contract != "" && uri && uri != "") {
      console.log(`Contract has changed`, contract);
      const uriNFT = uri;
      sendMintNFT({uriNFT});
    }
    childBalance ();
    list ();
  }, [contract]);

  useEffect(() => {
    list ();
  }, [balance]);

  // useEffect(() => {
  //   console.log(listNft);
  // }, [listNft]);


  

  const mintNFT = async (event) => {
    event.preventDefault();

    setUri("ipfs://QmaQNPLWTSKNXCvzURSi3WrkywJ1qcnYC56Dw1XMrxYZ7Z");
    setName(event.target.nft_name.value);
    setSymbol(event.target.nft_symbol.value);
    setDescription(event.target.nft_description.value);

    if (!contract || contract == "") {

      // Deploy new contract
      await deployNFTContract({name, symbol, description});
      // await connectContract("0x48Fb0Ed23e8cccF1887aE61bCFD3255DE7EBffB6");

    } else if (contract) {

      const uriNFT = uri;
      sendMintNFT({uriNFT});
    }
  }

  const sendMintNFT = async ({uriNFT}) => {

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    // mint(address recipient, string memory uri)
    const resp = await contract.connect(signer)["mint(address,string)"](await signer.getAddress(), uriNFT);
    // const resp = await contract.connect(signer).mint(await signer.getAddress(), uriNFT);

    const tx = await resp.wait();
    console.log(tx);

    const tokenId = tx.events[0].args[2].toNumber();
    console.log("new token id",tokenId);
    setTokenId(tokenId);
  }

  /**
   * Connect existing contract
   */
  const connectContract = (contractAddress) => {
    if (contractAddress && contractAddress != "") {
      // Connect to contract
      let provider = ethers.getDefaultProvider();
      const contractNFT = new ethers.Contract(contractAddress, KoChildERC721MintableTokenContractAbi.abi, provider);

      // Save contract instance in Hook "contract"
      setContract(contractNFT);
    }
  }

  /**
   * Deploy new contract
   * @param name
   * @param symbol
   * @param description
   * @returns {Promise<void>}
   */
  const deployNFTContract = async ({name, symbol, description}) => {

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    const factory = new ethers.ContractFactory(
      KoChildERC721MintableTokenContractAbi.abi,
      KoChildERC721MintableTokenContractAbi.bytecode,
      signer
    );

    // If your contract requires constructor args, you can specify them here
    const childChainManager = "0xb5505a6d998549090530911180f38aC5130101c6";
    const contractNFT = await factory.deploy(name, symbol, childChainManager);

    console.log("new contract address",contractNFT.address);
    console.log("deployTransaction",contractNFT.deployTransaction);

    setContract(contractNFT);
  }

  const transferNFT = async (event) => {
    event.preventDefault();

    console.log("Tranfert nft started.");

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const from = await signer.getAddress();

    const tokenId = event.target.transfer_token_id.value;
    const to = event.target.transfer_recipient.value;

    console.log("transferFrom",from, to, tokenId);

    const resp = await contract.connect(signer).transferFrom(from, to, tokenId);
    const tx = await resp.wait()
    console.log(tx);

    const owner = await getTokenOwner({signer,tokenId});
    console.log("old owner",from);
    console.log("new owner",owner);

    console.log("Tranfert nft finished.");
  }

  const getTokenOwner = async ({signer,tokenId}) => {
    const resp = await contract.connect(signer).ownerOf(tokenId);
    return resp;
  }
  
  const childBalance = () => {
    // Make a request for a user with a given ID
    axios.post(`http://localhost:3000/api/child/balance`, {
      owner: "0x43e6B95803ac909f31C46517691cd2e33e298e40",
      nftAddress:"0xC13bF24Cc00564fA00C7161ea4DCCDd4E00e1d1C"})
    .then(function (response) {
      // handle success
      console.log(response);
      console.log(response.data.balanceOf);
      setBalance(response.data.balanceOf);
    })
    .catch(function (error) {
      // handle error
      console.log(error);
    });
  }

  const list = () => {
    setListNft ([]);
    for (let i = 0; i < balance; i++) {
      axios.post(`http://localhost:3000/api/child/tokenByIndex`, {
        owner: "0x43e6B95803ac909f31C46517691cd2e33e298e40",
        nftAddress: "0xC13bF24Cc00564fA00C7161ea4DCCDd4E00e1d1C",
        index:i
      })
      .then(function (response) {
        // handle success
        setListNft(oldListNft => [...oldListNft, response.data.tokenByIndex].sort(function(a, b) {
          return a - b;
        }));
        //listNft.push(response.data.tokenByIndex);
      
        //console.log("listNFT",listNft);
      })  
      .catch(function (error) {
        // handle error
        console.log(error);
      });     
    }
  }

  const nftListRender = () => {
    if (listNft && listNft.length > 0) {
      return listNft.map((nft, index) => {
        console.log(index, nft);
        return <div key={index}>{nft}</div>
      })
    }
  }
  return (
    <div className="App">
      <header className="App-header">
        <h1>KO NFT</h1>
      </header>
      <div><ConnectWeb3/></div>
      <h2>ADD NFT</h2>
      <form method={"post"} onSubmit={mintNFT}>
        <div>
          <input type="file" id="nft_asset" name="nft_asset"/>
        </div>
        <div>
          <label htmlFor="nft_name">Name</label>
          <input type="text" id="nft_name" placeholder="KO NFT 0"/>
        </div>
        <div>
          <label htmlFor="nft_symbol">Symbol</label>
          <input type="text" id="nft_symbol" placeholder="KONFT0"/>
        </div>
        <div>
          <label htmlFor="nft_description">Description</label>
          <input type="text" id="nft_description" placeholder="KO NFT0 description"/>
        </div>
        <div>
          <button type={"submit"}>Mint NFT</button>
        </div>
      </form>

      <div>
        {contract.address}
      </div>

      <div>
        {tokenId}
      </div>


      <h2>Transfer NFT</h2>
      <form method={"post"} onSubmit={transferNFT}>
        <div>
          <label>Recipient</label>
          <input name={"transfer_recipient"} id={"transfer_recipient"} type={"text"} />
        </div>

        <div>
          <label>Token ID</label>
          <input name={"transfer_token_id"} id={"transfer_token_id"} type={"number"} />
        </div>

        <div>
          <button type={"submit"}>Transfer</button>
        </div>

      </form>

      <div>
        <h2>User NFT</h2>
        balance:{balance}
        <p>List of NFTs</p>
        id:{nftListRender()}
      </div>


    </div>
  )
}

export default App
