import React, {useState, useEffect} from "react";
import {ethers} from 'ethers'
import axios from "axios";

import ConnectWeb3 from './components/connect-web3'
import KoChildERC721MintableTokenContractAbi from './contract/KoChildERC721MintableToken.json'

import './App.css'
import KoNftList from "./components/KoNftList";

const apiUrl = {
  // root: "https://nodejs-api-contracts.vercel.app",
  root: "http://localhost:3000",
  rootTokenByIndex: `/api/root/tokenByIndex`,
  childTokenByIndex: `/api/child/tokenByIndex`,
  rootBalance: `/api/root/balance`,
  childBalance: `/api/child/balance`,
  approve: `/api/root/approve`,
  deposit: `/api/root/deposit`,
  burn: `/api/child/burn`,
  exit: `/api/child/exit`,
};

const contractAddress = {
  root: "0x3Ad9a856eDcACFCBF2d4A32194C9e2DbDA4E35Ee",
  child: "0x65061e7c2CDa20Adf3c80Ec61621E0Fca9D1d862",
};

function App() {

  const [contract, setContract] = useState("");
  const [uri, setUri] = useState("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [balance, setBalance] = useState(0);
  const [listNft, setListNft] = useState();
  const [chainId, setChainId] = useState(0);
  const [burnTxHashList, setBurnTxHashList] = useState([]);
  const [userAddress, setUserAddress] = useState("");

  // When account change, execute loadAddressUser
  window.ethereum.on('accountsChanged', (accounts) => {
    loadAddressUser();
  });

  /**
   * Update chainId when chain changed
   */
  window.ethereum.on('chainChanged', (newChainId) => {
    console.log("chainId",parseInt(newChainId,16),chainId);
    if (parseInt(newChainId,16) !== chainId) {
      setChainId(parseInt(newChainId,16));
    }
  });

  /**
   * First initialisation
   */
  useEffect(() => {
    loadChainId();
  }, []);

  /**
   * Reload data when chainId changed
   */
  useEffect(() => {
    refresh();
  }, [chainId]);

  /**
   * Reload data when contract changed
   */
  useEffect(() => {
    // if (contract && contract != "" && uri && uri != "") {
    //   console.log(`Contract has changed`, contract);
    //   const uriNFT = uri;
    //   sendMintNFT({uriNFT});
    // }
    refresh();
  }, [contract]);

  /**
   * Refreche list when balance changed
   */
  useEffect(() => {
    list();
  }, [balance]);

  const refresh = () => {
    loadAddressUser();
    loadBalance();
  }

  /**
   * Load chain id
   */
  const loadChainId = () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    provider.getNetwork().then((network) => {

      setChainId(network.chainId);

    }).catch((error) => {
      console.error(error);
    })
  }

  /**
   * Load Metamask User Address
   */
  const loadAddressUser = () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    signer.getAddress().then((address) => {
      setUserAddress(address);
    });
  }

  /**
   * Approve the token for deposit (Ethereum to Polygon)
   * @param tokenId
   */
  const approve = (tokenId) => {
    const url = `${apiUrl.root}${apiUrl.approve}`;
    axios.post(url, {
      contractAddress: contractAddress.root,
      from: userAddress,
      tokenId: tokenId
    })
      .then(function (approveTx) {
        console.log({approveTx});
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  /**
   * Deposit : token transfer Ethereum to Polygon
   * @param tokenId
   */
  const deposit = (tokenId) => {
    const url = `${apiUrl.root}${apiUrl.approve}`;
    axios.post(url, {
      contractAddress: contractAddress.root,
      from: userAddress,
      tokenId: tokenId
    })
      .then(function (depositTx) {
        console.log({depositTx});
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  /**
   * Burn the token and prepare token Matic transfer to Ethereum
   * @param tokenId
   */
  const burn = (tokenId) => {
    const url = `${apiUrl.root}${apiUrl.child}`;
    console.log("burn", contractAddress);
    axios.post(url, {
      contractAddress: contractAddress.child,
      tokenId: tokenId,
      from: userAddress
    })
      .then(function (burnTx) {
        console.log({burnTx});
        addBurnTxHash(tokenId, burnTx);
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  /**
   * Add burn transaction hash in state
   * @param tokenId
   * @param burnTx
   */
  const addBurnTxHash = (tokenId, burnTx) => {
    const newBurnTxHashList = {...burnTxHashList};
    newBurnTxHashList[tokenId] = burnTx;
    setBurnTxHashList(newBurnTxHashList);
  }

  /**
   * Finish transfer of token Matic to Ethereum
   * @param burnTxHash
   */
  const exit = (burnTxHash) => {
    const url = `${apiUrl.root}${apiUrl.exit}`;
    axios.post(url, {
      burnTxHash: burnTxHash,
      from: userAddress
    })
      .then(function (burnTx) {
        console.log({burnTx});
      })
      .catch(function (error) {
        console.log(error);
      });
  }


  /**
   * Create a NFT and Contract if not exist
   * @param event
   * @returns {Promise<void>}
   */
  const mintNFT = (event) => {
    event.preventDefault();

    setUri("ipfs://QmaQNPLWTSKNXCvzURSi3WrkywJ1qcnYC56Dw1XMrxYZ7Z");
    setName(event.target.nft_name.value);
    setSymbol(event.target.nft_symbol.value);
    setDescription(event.target.nft_description.value);

    if (!contract || contract == "") {

      // Deploy new contract
      deployNFTContract({name, symbol, description}).then(() => {

        const uriNFT = uri;
        sendMintNFT({uriNFT}).then(() => {
          console.log("Mint finished.")
        }).catch((error) => {
          console.error(error);
        });

      }).catch((error) => {
        console.error(error);
      });
      // await connectContract("0x48Fb0Ed23e8cccF1887aE61bCFD3255DE7EBffB6");

    } else if (contract && contract !== "") {

      const uriNFT = uri;
      sendMintNFT({uriNFT}).then(() => {
        console.log("Mint finished.")
      }).catch((error) => {
        console.error(error);
      });
    }
  }

  /**
   * Send Mint NFT Action
   * @param uriNFT
   * @returns {Promise<void>}
   */
  const sendMintNFT = async ({uriNFT}) => {

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    // mint(address recipient, string memory uri)
    const resp = await contract.connect(signer)["mint(address,string)"](await signer.getAddress(), uriNFT);
    // const resp = await contract.connect(signer).mint(await signer.getAddress(), uriNFT);

    const tx = await resp.wait();
    console.log(tx);

    const tokenId = tx.events[0].args[2].toNumber();
    console.log("new token id", tokenId);
    setBalance(balance + 1);
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

    console.log("new contract address", contractNFT.address);
    console.log("deployTransaction", contractNFT.deployTransaction);

    setContract(contractNFT);
  }

  /**
   * Transfer NFT to other user
   * @param event
   * @returns {Promise<void>}
   */
  const transferNFT = async (event) => {
    event.preventDefault();

    console.log("Tranfert nft started.");

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const from = await signer.getAddress();

    const tokenId = event.target.transfer_token_id.value;
    const to = event.target.transfer_recipient.value;

    console.log("transferFrom", from, to, tokenId);

    const resp = await contract.connect(signer).transferFrom(from, to, tokenId);
    const tx = await resp.wait()
    console.log(tx);

    const owner = await getTokenOwner({signer, tokenId});
    console.log("old owner", from);
    console.log("new owner", owner);

    console.log("Tranfert nft finished.");
  }

  /**
   * Get Token Owner Address
   * @param signer
   * @param tokenId
   * @returns {Promise<*>}
   */
  const getTokenOwner = async ({signer, tokenId}) => {
    const resp = await contract.connect(signer).ownerOf(tokenId);
    return resp;
  }

  /**
   * Load user token balance
   */
  const loadBalance = () => {
    // Make a request for a user with a given ID
    let url = null;
    let nftAddress = "";

    if (chainId === 5) {

      url = `${apiUrl.root}${apiUrl.rootBalance}`;
      nftAddress = contractAddress.root;

    } else if (chainId === 80001) {

      url = `${apiUrl.root}${apiUrl.childBalance}`;
      nftAddress = contractAddress.child;
    }

    console.log({url,userAddress,nftAddress})

    if (url) {
      axios.post(url, {
        owner: userAddress,
        nftAddress: nftAddress
      })
        .then(function (response) {
          // handle success
          console.log(response);
          console.log(response.data.balanceOf);
          setBalance(parseInt(response.data.balanceOf));
        })
        .catch(function (error) {
          // handle error
          console.log(error);
        });
    }
  }

  /**
   * Load user token list
   */
  const list = () => {
    setListNft([]);

    let url = null;
    let nftAddress = "";

    console.log("chainId : ", chainId);
    if (chainId === 5) {

      url = `${apiUrl.root}${apiUrl.rootTokenByIndex}`;
      nftAddress = contractAddress.root;

    } else if (chainId === 80001) {

      url = `${apiUrl.root}${apiUrl.childTokenByIndex}`;
      nftAddress = contractAddress.child;
    }

    console.log("list url : ", url);
    if (url) {
      for (let i = 0; i < balance; i++) {
        axios.post(url, {
          owner: userAddress,
          nftAddress: nftAddress,
          index: i
        })
          .then(function (response) {
            // handle success
            setListNft(oldListNft => [...oldListNft, response.data.tokenByIndex].sort(function (a, b) {
              return a - b;
            }));
          })
          .catch(function (error) {
            console.log(error);
          });
      }
    }
  }

  /**
   * Render user token list
   * @returns {JSX.Element}
   */
  const nftListRender = () => {
    return <KoNftList
      chainId={chainId}
      nftList={listNft}
      approve={approve}
      deposit={deposit}
      burn={burn}
      exit={exit}
      burnTxHashList={burnTxHashList}
    />;
  }

  const renderContractAddress = () => {
    if (chainId === 5) {
      return (
        <div>
          <div style={{fontWeight: "bold"}}>Ethereum Contract</div>
          {contractAddress.root}
        </div>
      );
    } else if (chainId === 80001) {
      return (
        <div>
          <div style={{fontWeight: "bold"}}>Polygon Contract</div>
          {contractAddress.child}
        </div>
      );
    }
  }

  /**
   * Render
   */
  return (
    <div className="App">
      <header className="App-header">
        <h1>KO NFT</h1>
      </header>

      <div>
        <ConnectWeb3/>
      </div>

      <div>
        {renderContractAddress()}
      </div>

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

      <h2>Transfer NFT</h2>
      <form method={"post"} onSubmit={transferNFT}>
        <div>
          <label>Recipient</label>
          <input name={"transfer_recipient"} id={"transfer_recipient"} type={"text"}/>
        </div>

        <div>
          <label>Token ID</label>
          <input name={"transfer_token_id"} id={"transfer_token_id"} type={"number"}/>
        </div>

        <div>
          <button type={"submit"}>Transfer</button>
        </div>

      </form>

      <div style={{textAlign: "center"}}>
        <h2>User NFT List</h2>
        balance:{balance}
        {nftListRender()}
      </div>

    </div>
  )
}

export default App
