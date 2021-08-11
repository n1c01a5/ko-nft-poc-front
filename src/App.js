import { ethers } from 'ethers'

import ConnectWeb3 from './components/connect-web3'
import KoChildERC721MintableTokenContractAbi from './contract/KoChildERC721MintableToken.json'
import KoChildERC721MintableTokenBytecode from './contract/KoChildERC721MintableTokenBytecode'

import './App.css'

function App() {
  const deployNFTContract = async ({name, symbol, description}) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()

    const factory = new ethers.ContractFactory(
      KoChildERC721MintableTokenContractAbi,
      KoChildERC721MintableTokenBytecode,
      signer
    )

    // If your contract requires constructor args, you can specify them here
    const contract = await factory.deploy()

    console.log(contract.address)
    console.log(contract.deployTransaction)
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>KO NFT</h1>
      </header>
      <div><ConnectWeb3 /></div>
      <h2>ADD NFT</h2>
      <div>
        <input type="file" id="nft_asset" name="nft_asset" />
      </div>
      <div>
        <label htmlFor="nft_name">Name</label>
        <input type="text" id="nft_name" placeholder="KO NFT 0" />
      </div>
      <div>
        <label htmlFor="nft_symbol">Symbol</label>
        <input type="text" id="nft_symbol"  placeholder="KONFT0" />
      </div>
      <div>
        <label htmlFor="nft_description">Description</label>
        <input type="text" id="nft_description" placeholder="KO NFT0 description" />
      </div>
      <div>
        <button onClick={deployNFTContract}>Mint NFT</button>
      </div>
    </div>
  )
}

export default App
