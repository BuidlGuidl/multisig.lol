import React from "react";

import { Button, Col, Row, Alert, Select } from "antd";
import { Route, Switch } from "react-router-dom";
import "./App.css";
import { Contract } from "./components";
import { Home, Hints, Subgraph, CreateTransaction, Transactions } from "./views";

/**----------------------
 * TODO:we can create a global context state and fetch all this props on individual components
 * ---------------------*/
const Routes = ({
  contractName,
  contractAddress,
  mainnetProvider,
  localProvider,
  price,
  readContracts,
  userSigner,
  nonce,
  signaturesRequired,
  blockExplorer,
  executeTransactionEvents,
  ownerEvents,
  address,
  yourLocalBalance,
  tx,
  writeContracts,
  contractConfig,
  userHasMultiSigs,
  currentMultiSigAddress,
  DEBUG,
  setIsCreateModalVisible,
  BACKEND_URL,
  mainnetContracts,
  subgraphUri,
  reDeployWallet,
  isFactoryDeployed,
}) => {
  return (
    <>
      <Switch>
        <Route exact path="/">
          {!userHasMultiSigs ? (
            <>
              {isFactoryDeployed !== undefined && (
                <Row style={{ marginTop: 40 }}>
                  <Col span={12} offset={6}>
                    <Alert
                      message={
                        <>
                          ✨{" "}
                          <Button onClick={() => setIsCreateModalVisible(true)} type="link" style={{ padding: 0 }}>
                            Create
                          </Button>{" "}
                          or select your Multi-Sig ✨
                        </>
                      }
                      type="info"
                    />
                  </Col>
                </Row>
              )}

              {isFactoryDeployed === undefined && (
                <Row style={{ marginTop: 40 }}>
                  <Col span={12} offset={6}>
                    <Alert
                      message={<> Sorry multisig not awailable on this network 😥 ( please change the network) </>}
                      type="error"
                    />
                  </Col>
                </Row>
              )}
            </>
          ) : (
            <>
              {currentMultiSigAddress && (
                <Home
                  key={currentMultiSigAddress}
                  address={address}
                  contractAddress={currentMultiSigAddress}
                  localProvider={localProvider}
                  price={price}
                  mainnetProvider={mainnetProvider}
                  blockExplorer={blockExplorer}
                  executeTransactionEvents={executeTransactionEvents}
                  contractName={contractName}
                  readContracts={readContracts}
                  ownerEvents={ownerEvents}
                  signaturesRequired={signaturesRequired}
                  poolServerUrl={BACKEND_URL}
                  reDeployWallet={reDeployWallet}
                  isFactoryDeployed={isFactoryDeployed}
                />
              )}
            </>
          )}
        </Route>
        <Route path="/create">
          <CreateTransaction
            poolServerUrl={BACKEND_URL}
            contractName={contractName}
            contractAddress={contractAddress}
            mainnetProvider={mainnetProvider}
            localProvider={localProvider}
            price={price}
            tx={tx}
            readContracts={readContracts}
            userSigner={userSigner}
            DEBUG={DEBUG}
            nonce={nonce}
            blockExplorer={blockExplorer}
            signaturesRequired={signaturesRequired}
          />
        </Route>
        <Route path="/pool">
          <Transactions
            poolServerUrl={BACKEND_URL}
            contractName={contractName}
            address={address}
            userSigner={userSigner}
            mainnetProvider={mainnetProvider}
            localProvider={localProvider}
            yourLocalBalance={yourLocalBalance}
            price={price}
            tx={tx}
            writeContracts={writeContracts}
            readContracts={readContracts}
            blockExplorer={blockExplorer}
            nonce={nonce}
            signaturesRequired={signaturesRequired}
          />
        </Route>
        <Route exact path="/debug">
          <Contract
            name={"MultiSigFactory"}
            price={price}
            signer={userSigner}
            provider={localProvider}
            address={address}
            blockExplorer={blockExplorer}
            contractConfig={contractConfig}
          />
        </Route>
        <Route path="/hints">
          <Hints
            address={address}
            yourLocalBalance={yourLocalBalance}
            mainnetProvider={mainnetProvider}
            price={price}
          />
        </Route>
        <Route path="/mainnetdai">
          <Contract
            name="DAI"
            customContract={mainnetContracts && mainnetContracts.contracts && mainnetContracts.contracts.DAI}
            signer={userSigner}
            provider={mainnetProvider}
            address={address}
            blockExplorer="https://etherscan.io/"
            contractConfig={contractConfig}
            chainId={1}
          />
          {/*
            <Contract
              name="UNI"
              customContract={mainnetContracts && mainnetContracts.contracts && mainnetContracts.contracts.UNI}
              signer={userSigner}
              provider={mainnetProvider}
              address={address}
              blockExplorer="https://etherscan.io/"
            />
            */}
        </Route>
        <Route path="/subgraph">
          <Subgraph
            subgraphUri={subgraphUri}
            tx={tx}
            writeContracts={writeContracts}
            mainnetProvider={mainnetProvider}
          />
        </Route>
      </Switch>
    </>
  );
};
export default Routes;
