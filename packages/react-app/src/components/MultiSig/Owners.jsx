import React, { useCallback, useEffect } from "react";
import { Select, List, Spin, Collapse } from "antd";
import axios from "axios";

// import { useEventListener } from "eth-hooks/events/";

import { Address } from "..";
import { useState } from "react";
// import useEventListener from "../../hooks/useEventListener";
import { useEventListener } from "eth-hooks/events/useEventListener";
import useEvent from "../../hooks/useEvent";

const { Panel } = Collapse;

function Owners({
  signaturesRequired,
  mainnetProvider,
  blockExplorer,
  contractName,
  localProvider,
  currentMultiSigAddress,
  reDeployWallet,
  contractNameForEvent,
  readContracts,
}) {
  const [ownerEvents, setOwnerEvents] = useState([]);

  const allOwnerEvents = useEventListener(
    contractNameForEvent in readContracts && readContracts,
    contractNameForEvent,
    "Owner",
    localProvider,
    0,
  );

  // const allOwnerEvents2 = useEvent(
  //   contractNameForEvent in readContracts && readContracts,
  //   contractNameForEvent,
  //   "Owner",
  //   false,
  // );
  // console.log(`n-🔴 => allOwnerEvents2`, allOwnerEvents2);

  const owners = new Set();
  const prevOwners = new Set();
  ownerEvents.forEach(ownerEvent => {
    if (ownerEvent.args.added) {
      owners.add(ownerEvent.args.owner);
      prevOwners.delete(ownerEvent.args.owner);
    } else {
      prevOwners.add(ownerEvent.args.owner);
      owners.delete(ownerEvent.args.owner);
    }
  });

  const loadOwnersEvents = async () => {
    setOwnerEvents(allOwnerEvents.filter(contractEvent => contractEvent.address === currentMultiSigAddress));
  };

  useEffect(() => {
    if (allOwnerEvents.length > 0) {
      loadOwnersEvents();
    }
  }, [allOwnerEvents.length]);

  return (
    <div>
      <h2 style={{ marginTop: 32 }}>
        Signatures Required:{" "}
        {/* {signaturesRequired && ownerEvents.length !== 0 ? signaturesRequired.toNumber() : <Spin></Spin>} */}
        {signaturesRequired ? signaturesRequired.toNumber() : <Spin></Spin>}
      </h2>
      <List
        header={<h2>Owners</h2>}
        style={{ maxWidth: 400, margin: "auto", marginTop: 32 }}
        bordered
        dataSource={[...owners]}
        loading={ownerEvents.length === 0}
        renderItem={ownerAddress => {
          return (
            <List.Item key={"owner_" + ownerAddress}>
              <Address
                address={ownerAddress}
                ensProvider={mainnetProvider}
                blockExplorer={blockExplorer}
                fontSize={14}
              />
            </List.Item>
          );
        }}
      />

      <Collapse
        collapsible={prevOwners.size == 0 ? "disabled" : ""}
        style={{ maxWidth: 400, margin: "auto", marginTop: 10 }}
      >
        <Panel header="Previous Owners" key="1">
          <List
            dataSource={[...prevOwners]}
            renderItem={prevOwnerAddress => {
              return (
                <List.Item key={"owner_" + prevOwnerAddress}>
                  <Address
                    address={prevOwnerAddress}
                    ensProvider={mainnetProvider}
                    blockExplorer={blockExplorer}
                    fontSize={20}
                  />
                </List.Item>
              );
            }}
          />
        </Panel>
      </Collapse>
    </div>
  );
}
export default Owners;
