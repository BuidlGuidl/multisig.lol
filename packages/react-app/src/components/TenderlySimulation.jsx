import { useEffect, useState } from "react";
import { Spin } from "antd";
import axios from "axios";

const { BigNumber, ethers } = require("ethers");

// set up your access-key, if you don't have one or you want to generate new one follow next link
// https://dashboard.tenderly.co/account/authorization

// Create a .env file in the react-app folder with the credentials
//REACT_APP_TENDERLY_USER = ""
//REACT_APP_TENDERLY_PROJECT = ""
//REACT_APP_TENDERLY_ACCESS_KEY = ""

const TENDERLY_USER = process.env.REACT_APP_TENDERLY_USER;
const TENDERLY_PROJECT = process.env.REACT_APP_TENDERLY_PROJECT;
const TENDERLY_ACCESS_KEY = process.env.REACT_APP_TENDERLY_ACCESS_KEY;

const SIMULATE_URL = `https://api.tenderly.co/api/v1/account/${TENDERLY_USER}/project/${TENDERLY_PROJECT}/simulate`;
const OPTS = {
  headers: {
    'X-Access-Key': TENDERLY_ACCESS_KEY
  }
}

export default function TenderlySimulation({ params, address, multiSigWallet, signaturesRequired}) {
  const [simulated, setSimulated] = useState(false);
  const [simulationFailed, setSimulationFailed] = useState(false);
  const [simulationUnexpectedError, setSimulationUnexpectedError] = useState(false);
  const [simulationId, setSimulationId] = useState();

  useEffect(()=> {
    const simulateTransaction = async () => {
      try {
        if (!params || !address || !multiSigWallet || !signaturesRequired) {
          return;
        }

        const value = params.amount ? ethers.utils.parseEther("" + parseFloat(params.amount).toFixed(12)) : "0x00";
        const txData = (params.data && params.data != "0x") ? params.data : "0x";
        const data = multiSigWallet.interface.encodeFunctionData("executeTransaction", [params.to, value, txData, params.signatures]);

        const multiSigWalletAddressLowerCase = multiSigWallet.address.toLowerCase(); // Tenderly does a lowerCase on the contract address

        let body; // Tenderly simulation transaction params

        const currentSignaturesCount = params.signatures.length;

        if (currentSignaturesCount < signaturesRequired.toNumber()) {
          // If there are not enough signatures, we need to do state overrides for the simulation
          // We override signaturesRequired with the currentSignaturesCount, 
          // so we can simulate the transaction even though we don't have all the signatures yet

          // Tenderly docs
          // https://tenderlydev.notion.site/Sim-API-With-State-Overrides-83d80213689b43de8f3d45e121689b42#0a87b56e05af47ffb2304777f9229843
          // https://tenderlydev.notion.site/Sim-API-With-State-Overrides-83d80213689b43de8f3d45e121689b42#e00e8c2a9183421a9495fb78742d9c58

/*
          I'm leaving step 1 and 2 here, even though it is not used right now
          In order to use state overrides, we need to verify the contract on Tenderly
          I did it once, so I could use the ENCODE_STATE_API and save the response,
          which can be reused for not verified contracts as well:

          "stateOverrides": {
              [multiSigWalletAddressLowerCase]: {
                  "value": {
                      "0x0000000000000000000000000000000000000000000000000000000000000003": "0x0000000000000000000000000000000000000000000000000000000000000001"
                  }
              }
            }
          };

          // 1: prepare state overrides. This is where you specify all the contracts you need to override for the simulation.
          const stateOverridesSpecification = {
            networkID: `${params.chainId}`, // a STRING: network ID as "3"
            // stateOverrides is a specification of assignments: Map<ContractAddress, AssignmentsSpecification>
            //    - The key is the contract's address (so you can override state in multiple contracts)
            //    - AssignmentsSpecification: The value is an object specifying overrides of state variables' values.
            //      To achieve kvStore[1] = 99 add "kvStore[1]": "99" to as an entry of the value map.
            //      Left hand side is the key in this JSON ("kvStore[1]") and right hand side of the assignment is the value ("99").
            //
            stateOverrides: {
                [multiSigWallet.address]: {
                    value: {
                        // overrides of contract state override (fields come from contract's state vars)
                        "signaturesRequired": "1",
                    }
                }
            }
          }

          // 2: Encode state overrides (intermediary step)
          const ENCODE_STATE_API = `https://api.tenderly.co/api/v1/account/${TENDERLY_USER}/project/${TENDERLY_PROJECT}/contracts/encode-states`;
          const encodedSatateResponse = await axios.post(ENCODE_STATE_API, stateOverridesSpecification, OPTS);
          const encodedStateOverrides = encodedSatateResponse.data;
 */         
          const encodedStateOverrides = {
            "stateOverrides": {
              [multiSigWalletAddressLowerCase]: {
                  "value": {
                      //"0x0000000000000000000000000000000000000000000000000000000000000003": "0x0000000000000000000000000000000000000000000000000000000000000001"
                      "0x0000000000000000000000000000000000000000000000000000000000000003": ethers.utils.hexlify(currentSignaturesCount)
                  }
              }
            }
          };

          // 3: Prepare transaction
          const unsignedTransactionToSimulate = await multiSigWallet.populateTransaction.signaturesRequired();

          // 4: Create a transaction and pass encodedStateOverrides under state_objects
          body = {
            ...unsignedTransactionToSimulate, // 
            input: data, // input is necessary
            network_id: `${params.chainId}`, //network ID: a string
            "from": address, // any address
            to: multiSigWalletAddressLowerCase,

            /* 
                This is again a mapping; Map<ContractAddress, {storage: encodedStorageOverrides }> 
                populate storage with the value in encodedStateOverrides which corresponds  
            */
            state_objects: {
                [multiSigWalletAddressLowerCase]: {
                    storage: encodedStateOverrides.stateOverrides[multiSigWalletAddressLowerCase].value
                }
            },
            save: true // saves to dashboard
          }

          console.log("Simulating with state overrides")
        }
        else {
          body = {
            // standard TX fields
            "network_id": params.chainId,
            "from": address,
            "to": multiSigWalletAddressLowerCase,
            "input": data,
            //"gas": 61606000,
            //"gas_price": "0",
            //"value": params.amount ? ethers.utils.parseEther(params.amount.toString()).toString() : "0", Let's keep this here to remember the hours long debugging
            "value": "0",
            // simulation config (tenderly specific)
            "save_if_fails": true,
            "save": true,
            //"simulation_type": "quick"
          }

          console.log("Simulating with all the signatures, without state overrides")
        }

        const simResponse = await axios.post(SIMULATE_URL, body, OPTS);
        console.log("Returned value: ", simResponse.data.transaction.transaction_info.call_trace.output);

        if (simResponse.data.simulation.status === false) {
          setSimulationFailed(true);
        }

        setSimulationId(simResponse.data.simulation.id);
        setSimulated(true);
      }
      catch(error) {
        setSimulationUnexpectedError(true);
        console.error("simulateTransaction", error)
      }
    }

    simulateTransaction();
  },[]);

  return (
    <div>
       <div style={{ textAlign: "center"}}>
          {!simulated && !simulationUnexpectedError && <>Simulating on Tenderly... <Spin/></>}
          {simulated && simulationId && <>Simulating on <a target="_blank" rel="noopener noreferrer" href={`https://dashboard.tenderly.co/public/${TENDERLY_USER}/${TENDERLY_PROJECT}/simulator/${simulationId}`}>Tenderly</a> {!simulationFailed ? "was successful!" : "has failed!"}</>}
          {simulationUnexpectedError && <>Couldn't simulate on <a target="_blank" rel="noopener noreferrer" href="https://tenderly.co/">Tenderly</a> because of an unexpected error.</>}
       </div>
    </div>
  );
}
