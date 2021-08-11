import { useState, useCallback, useEffect } from 'react'
import { ethers } from 'ethers'

// import StorageABI from '../contract/storage.json'

export default function ConnectWeb3() {
  const [isConnectedWeb3, setIsConnectedWeb3] = useState("")
  const [addressSigner, setAddressSigner] = useState("0x00")

  useEffect(() => {
    const connectWeb3Fn = async () => {
      if(window.ethereum) {
        try {
          await window.ethereum.request({method: 'eth_requestAccounts'})

          const provider = new ethers.providers.Web3Provider(window.ethereum)
          const signer = provider.getSigner()

          setAddressSigner(await signer.getAddress())
        } catch (err) {
          console.error(err)
        }
      } else {
        alert("Install Metamask")
      }
    }

    connectWeb3Fn()


  }, [])

  return <div>Connect with {addressSigner}</div>
}
