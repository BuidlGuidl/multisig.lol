var express = require("express");
var fs = require("fs");
const https = require("https");
var cors = require("cors");
var bodyParser = require("body-parser");
var app = express();

const port = Number(process.env.PORT) || 49899;

let transactions = {};
let wallets = {};

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", function (req, res) {
  console.log("/");
  res.status(200).send("hello world");
});
app.get("/:key", function (req, res) {
  let key = req.params.key;
  console.log("/", key);
  res.status(200).send(transactions[key]);
});

// app.post("/", function (request, response) {
//   console.log("POOOOST!!!!", request.body); // your JSON
//   response.send(request.body); // echo the result back
//   const key = request.body.address + "_" + request.body.chainId;
//   console.log("key:", key);
//   if (!transactions[key]) {
//     transactions[key] = {};
//   }
//   transactions[key][request.body.hash] = request.body;
//   console.log("transactions", transactions);
// });

/**
 return tx data
*/

app.get(
  "/getPool/:chainId/:walletAddress/:currentNonce/:type",
  function (request, response) {
    const { walletAddress, currentNonce, chainId, type } = request.params;
    console.log(`n-🔴 => request.params`, request.params);

    const key = walletAddress + "_" + chainId;
    console.log(`n-🔴 => key`, key);
    console.log(`n-🔴 => transactions`, transactions);

    if (!transactions[key]) {
      return response.json({ data: [] });
    }

    if (transactions[key]) {
      if (type === "QUEUE") {
        let filteredPool = transactions[key].filter(
          (data) => data.nonce >= currentNonce
        );

        // data.signers.includes(walletAddress)
        console.log(`n-🔴 => filteredPool in queue`, filteredPool);
        return response.json({ data: filteredPool });
      }

      if (type === "ALL") {
        let filteredPool = transactions[key]
          .filter(
            (item) =>
              item.nonce < currentNonce &&
              (item.status === "success" || item.status === "rejected")
          )
          .sort((A, B) => B.nonce - A.nonce);

        console.log(`n-🔴 => filteredPool success`, filteredPool);
        return response.json({ data: filteredPool });
      }
    }
  }
);

/**
 store tx data
*/

app.post("/addPoolTx", function (request, response) {
  //   const { chainId } = request.params;
  //   const { ownerAddress } = request.body;
  console.log(`n-🔴 => request.body`, request.body);
  //   response.send(request.body); // echo the result back
  const key = request.body.walletAddress + "_" + request.body.chainId;
  if (!transactions[key]) {
    if (request.body.hash) {
      transactions[key] = [{ ...request.body }];
    }

    console.log(`n-🔴 => transactions[key]`, transactions[key].length);
    return response.json({ transactions });
  }

  if (transactions[key]) {
    transactions[key].push({ ...request.body });
    console.log(`n-🔴 => transactions[key]`, transactions[key].length);
    return response.json({ transactions });
  }
});

/**
 update signature data
*/
app.post("/updateTx", function (request, response) {
  //   const { chainId } = request.params;
  const { txId, walletAddress, chainId, newData } = request.body;
  console.log(`n-🔴 => request.body`, request.body);
  //   response.send(request.body); // echo the result back
  const key = request.body.walletAddress + "_" + request.body.chainId;

  if (!transactions[key]) {
    return response.json({ data: [] });
  }
  if (transactions[key]) {
    // transactions[key].push({ ...request.body });
    transactions[key] = transactions[key].map((txData) => {
      if (txData.txId === txId) {
        txData = { ...txData, ...newData };
        console.log(`n-🔴 => transactions[key].map => txData`, txData);
      }
      return txData;
    });
    // transactions[key] = [...transactions[key], updatedData];
    return response.json({ data: transactions[key] });
  }
});

/**----------------------
 * to get list
 * ---------------------*/
app.get("/getWallets/:ownerAddress", function (request, response) {
  const { ownerAddress } = request.params;

  if (wallets[ownerAddress] === undefined) {
    wallets[ownerAddress] = [];
  }

  let userWallets = Object.keys(wallets).map((ownerAddr) => {
    let filteredOwners = wallets[ownerAddr].filter((walletData) =>
      walletData.owners.includes(ownerAddress)
    );
    if (filteredOwners.length > 0) {
      return filteredOwners;
    } else {
      return [];
    }
  });
  response.status(200).send({ userWallets: userWallets.flat() });
});

/**----------------------
 * to add a user wallet to a list
 * ---------------------*/
app.post(
  "/createWallet/:ownerAddress/:walletName/:walletAddress/:chainId",
  function (request, response) {
    let { ownerAddress, walletName, walletAddress, chainId } = request.params;
    const { owners, signaturesRequired } = request.body;

    chainId = Number(chainId);

    if (wallets[ownerAddress] === undefined) {
      console.log(
        `create wallet ${walletName} for ${ownerAddress} on ${chainId} `
      );
      wallets[ownerAddress] = [];
      wallets[ownerAddress].push({
        walletName,
        walletAddress,
        chainIds: [chainId],
        signaturesRequired,
        owners,
      });
    } else {
      let isWalletExists = wallets[ownerAddress].find(
        (data) => data.walletAddress === walletAddress
      );

      // if no wallet exist then push else skip
      if (isWalletExists === undefined) {
        console.log(
          `create wallet ${walletName} for ${ownerAddress} on ${chainId} `
        );
        wallets[ownerAddress].push({
          walletName,
          walletAddress,
          chainIds: [Number(chainId)],
          signaturesRequired,
          owners,
        });
      }
      // if data is exisist then only update the chainid
      if (isWalletExists !== undefined) {
        console.log(
          `update wallet ${walletName} for ${ownerAddress} on ${chainId} `
        );

        wallets[ownerAddress].map((data) => {
          if (data.walletAddress === walletAddress) {
            // data.chainIds.push(chainId);
            data.chainIds = [...new Set([...data.chainIds, Number(chainId)])];
          }
          return data;
        });
      }
    }

    response.status(200).send(wallets[ownerAddress]);
  }
);
/**----------------------
 * update a chainId for a address
 * ---------------------*/
app.get(
  "/updateChainId/:ownerAddress/:walletAddress/:chainId",
  function (request, response) {
    let { ownerAddress, walletAddress, chainId } = request.params;
    chainId = Number(chainId);

    wallets[ownerAddress].map((data) => {
      if (data.walletAddress === walletAddress) {
        // data.chainIds.push(chainId);
        data.chainIds = [...new Set([...data.chainIds, chainId])];
      }
      return data;
    });

    response.status(200).send(wallets[ownerAddress]);
  }
);

/**----------------------
 * update owner list
 * ---------------------*/
app.post(
  "/updateOwners/:ownerAddress/:walletAddress",
  function (request, response) {
    let { ownerAddress, walletAddress } = request.params;
    let { owners } = request.body;

    wallets[ownerAddress].map((data) => {
      if (data.walletAddress === walletAddress) {
        // data.chainIds.push(chainId);
        // data.owners = [...new Set([...data.owners, ...owners])];
        data.owners = [...new Set([...owners])];
      }
      return data;
    });

    response.status(200).send(wallets[ownerAddress]);
  }
);

if (fs.existsSync("server.key") && fs.existsSync("server.cert")) {
  https
    .createServer(
      {
        key: fs.readFileSync("server.key"),
        cert: fs.readFileSync("server.cert"),
      },
      app
    )
    .listen(port, () => {
      console.log("HTTPS Listening: 49899");
    });
} else {
  var server = app.listen(port, "0.0.0.0", function () {
    console.log("HTTP Listening on port:", server.address().port);
  });
}
