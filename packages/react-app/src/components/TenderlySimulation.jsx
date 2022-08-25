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

export default function TenderlySimulation({ params, address, multiSigWallet}) {
  const [simulated, setSimulated] = useState(false);
  const [simulationFailed, setSimulationFailed] = useState(false);
  const [simulationUnexpectedError, setSimulationUnexpectedError] = useState(false);
  const [simulationId, setSimulationId] = useState();

  useEffect(()=> {
    const simulateTransaction = async () => {
      try {
        if (!params || !address || !multiSigWallet) {
          return;
        }

        const value = params.amount ? ethers.utils.parseEther("" + parseFloat(params.amount).toFixed(12)) : "0x00";
        const txData = (params.data && params.data != "0x") ? params.data : "0x";
        let data = multiSigWallet.interface.encodeFunctionData("executeTransaction", [params.to, value, txData, params.signatures]);

        const body = {
          // standard TX fields
          "network_id": params.chainId,
          "from": address,
          "to": multiSigWallet.address,
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
      
        const resp = await axios.post(SIMULATE_URL, body, OPTS);

        if (resp.data.simulation.status === false) {
          setSimulationFailed(true);
        }

        setSimulationId(resp.data.simulation.id);
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
