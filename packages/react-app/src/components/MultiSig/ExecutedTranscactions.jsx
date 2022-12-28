import React from "react";

import { Collapse, List } from "antd";
import { useState, useEffect } from "react";

import { TransactionListItem } from "../index";

import { useEventListener } from "eth-hooks/events/useEventListener";

// import useEventListener from "../../hooks/useEventListener";

// const { Text } = Typography;
const { Panel } = Collapse;

function ExecutedTranscactions({
  localProvider,
  price,
  mainnetProvider,
  blockExplorer,
  contractName,
  readContracts,
  currentMultiSigAddress,
  contractNameForEvent,
}) {
  const allExecuteTransactionEvents = useEventListener(
    contractNameForEvent in readContracts && readContracts,
    contractNameForEvent,
    "ExecuteTransaction",
    localProvider,
    0,
  );

  return (
    <>
      {/* executed tx's */}
      <Collapse className="w-full">
        <Panel
          header={
            <>
              <h1>Executed transcactions</h1>
            </>
          }
          key="1"
        >
          {/* <div>
            <List
              dataSource={txData}
              loading={txListLoading}
              renderItem={item => {
                return (
                  <div className="border-2 rounded-3xl shadow-md mt-4 ">
                    {"MultiSigWallet" in readContracts && (
                      <>
                        <TransactionListItem
                          item={Object.create(item)}
                          mainnetProvider={mainnetProvider}
                          blockExplorer={blockExplorer}
                          price={price}
                          readContracts={readContracts}
                          contractName={contractName}
                        />
                      </>
                    )}
                  </div>
                );
              }}
            />
          </div> */}

          <div className="">
            <List
              dataSource={allExecuteTransactionEvents
                .filter(contractEvent => contractEvent.address === currentMultiSigAddress)
                .reverse()}
              renderItem={item => (
                <div className="border-2 rounded-3xl shadow-md mt-4 ">
                  {"MultiSigWallet" in readContracts && (
                    <>
                      <TransactionListItem
                        item={Object.create(item)}
                        mainnetProvider={mainnetProvider}
                        blockExplorer={blockExplorer}
                        price={price}
                        readContracts={readContracts}
                        contractName={contractName}
                      />
                    </>
                  )}
                </div>
              )}
            />
          </div>
        </Panel>
      </Collapse>
    </>
  );
}

export default ExecutedTranscactions;
