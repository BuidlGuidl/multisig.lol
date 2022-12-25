import React from "react";

import { Collapse, List, Pagination, Button, Skeleton, Divider } from "antd";
import { useEffect, useState } from "react";

import { TransactionListItem } from "../index";

import { useEventListener } from "eth-hooks/events/useEventListener";
import { useRef } from "react";
import InfiniteScroll from "react-infinite-scroll-component";

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
  const pageSize = 20;
  // const totalEvents = allExecuteTransactionEvents.length;

  const [executeTransactionEvents, setExecuteTransactionEvents] = useState(undefined);
  const [txListLoading, setTxListLoading] = useState(false);
  // const [totalEvents, setTotalEvents] = useState(0);
  const [txData, setTxData] = useState([]);
  const pageCountRef = useRef(0);

  const totalEventsCount = allExecuteTransactionEvents?.filter(
    contractEvent => contractEvent.address === currentMultiSigAddress,
  ).length;

  const pagePageChange = selectedPage => {
    const endIndex = selectedPage === 1 ? pageSize : selectedPage * pageSize;
    const startIndex = selectedPage === 1 ? selectedPage - 1 : endIndex - pageSize;

    const filteredEvents = allExecuteTransactionEvents
      .filter(contractEvent => contractEvent.address === currentMultiSigAddress)
      .slice(startIndex, endIndex);

    setExecuteTransactionEvents(filteredEvents.reverse());
    setTxListLoading(false);
  };

  const onLoadMore = () => {
    const fromIndex = pageCountRef.current === 0 ? pageCountRef.current : pageCountRef.current + 1;
    const toIndex = pageCountRef.current + pageSize;
    let currentData = allExecuteTransactionEvents
      .filter(contractEvent => contractEvent.address === currentMultiSigAddress)
      .slice(fromIndex, toIndex);

    setTxData([...txData, ...currentData]);
    pageCountRef.current = pageCountRef.current + pageSize;
  };

  const onExpand = value => {
    if (value.length > 0) {
      onLoadMore();
    }
  };

  return (
    <>
      {/* executed tx's */}
      <Collapse className="w-full" onChange={onExpand}>
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

          <div id="scrollableDiv" className="w-full overflow-auto h-96 p-2">
            <InfiniteScroll
              initialScrollY={100}
              dataLength={txData.length}
              next={onLoadMore}
              hasMore={pageCountRef.current < totalEventsCount}
              loader={
                <Skeleton
                  avatar
                  paragraph={{
                    rows: 1,
                  }}
                  active
                />
              }
              endMessage={
                <Divider plain className="opacity-70">
                  Loaded all tx's
                </Divider>
              }
              scrollableTarget="scrollableDiv"
            >
              <List
                dataSource={txData}
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
            </InfiniteScroll>
          </div>
        </Panel>
      </Collapse>
    </>
  );
}

export default ExecutedTranscactions;
