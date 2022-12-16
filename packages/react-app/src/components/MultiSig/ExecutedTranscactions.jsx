import React from "react";

import { Collapse, List, Pagination } from "antd";
import { useEffect, useState } from "react";

import { TransactionListItem } from "../index";

import { useEventListener } from "eth-hooks/events/useEventListener";

// import useEventListener from "../hooks/useEventListener";

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
  const pageSize = 10;
  const totalEvents = allExecuteTransactionEvents.length;

  const [executeTransactionEvents, setExecuteTransactionEvents] = useState(undefined);
  const [txListLoading, setTxListLoading] = useState(true);

  const pagePageChange = selectedPage => {
    const endIndex = selectedPage === 1 ? pageSize : selectedPage * pageSize;
    const startIndex = selectedPage === 1 ? selectedPage - 1 : endIndex - pageSize;

    const filteredEvents = allExecuteTransactionEvents
      .filter(contractEvent => contractEvent.address === currentMultiSigAddress)
      .slice(startIndex, endIndex);

    setExecuteTransactionEvents(filteredEvents.reverse());
    setTxListLoading(false);
  };

  useEffect(() => {
    if (allExecuteTransactionEvents.length > 0) {
      pagePageChange(1);
    } else {
      setTxListLoading(false);
    }
  }, [allExecuteTransactionEvents]);

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
          <div>
            <Pagination defaultCurrent={1} total={totalEvents} defaultPageSize={pageSize} onChange={pagePageChange} />
          </div>
          <div>
            <List
              dataSource={executeTransactionEvents}
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
          </div>
        </Panel>
      </Collapse>
    </>
  );
}

export default ExecutedTranscactions;
