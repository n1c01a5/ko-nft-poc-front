import React, {Fragment} from 'react';

const KoNftList = (props) => {

  const {chainId, approve, deposit, burn, exit, burnTxHashList} = props;

  const depositHandle = (tokenId) => {
    deposit(tokenId);
  }

  const approveHandle = (tokenId) => {
    approve(tokenId);
  }

  const burnHandle = (tokenId) => {
    burn(tokenId);
  }

  const exitHandle = (idNft) => {
    exit(idNft);
  }

  const burnTxRender = (idNft) => {
    if (burnTxHashList && burnTxHashList.length > 0 && burnTxHashList[idNft]) {
      return burnTxHashList[idNft].transactionHash;
    }
  }

  /**
   * Render one nft
   * @param nft
   * @param index
   * @returns {JSX.Element}
   */
  const renderNft = (idNft, index) => {
    return (
      <Fragment key={index}>
        <tr>
          <td>{idNft}</td>
          <td>
            {renderNftButtons(idNft)}
          </td>
        </tr>
        <tr>
          <td colSpan={2}>
            {burnTxRender(idNft)}
          </td>
        </tr>
      </Fragment>
    );
  }

  const renderNftButtons = (idNft) => {
    if (chainId == 5) {
      return (
        <div>
          <button onClick={() => {
            approveHandle(idNft)
          }}>
            Aprouve
          </button>

          <button onClick={() => {
            depositHandle(idNft)
          }}>
            Deposit
          </button>

        </div>
      );
    } else {
      return (
        <div>

          <button onClick={() => {
            burnHandle(idNft)
          }}>
            Burn
          </button>

          <button onClick={() => {
            exitHandle(idNft)
          }}>
            Exit
          </button>
        </div>
      );
    }
  }

  const renderNftList = () => {
    const {nftList} = props;
    if (nftList && nftList.length > 0) {
      return nftList.map((nft, index) => {
        return renderNft(nft, index);
      });
    }
  }

  return (
    <table style={{marginLeft: "auto", marginRight: "auto"}}>
      <thead>
      <tr>
        <th style={{borderBottom: "1px solid black"}}>ID</th>
        <th style={{borderBottom: "1px solid black", textAlign: "start"}}>Actions</th>
      </tr>
      </thead>
      <tbody>
      {renderNftList()}
      </tbody>
    </table>
  );
};

export default KoNftList;
