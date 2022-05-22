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

app.post("/", function (request, response) {
    console.log("POOOOST!!!!", request.body); // your JSON
    response.send(request.body); // echo the result back
    const key = request.body.address + "_" + request.body.chainId;
    console.log("key:", key);
    if (!transactions[key]) {
        transactions[key] = {};
    }
    transactions[key][request.body.hash] = request.body;
    console.log("transactions", transactions);
});

/**----------------------
 * to get list
 * ---------------------*/
app.get("/getWallets/:ownerAddress", function (request, response) {
    const { ownerAddress } = request.params;

    if (wallets[ownerAddress] === undefined) {
        wallets[ownerAddress] = [];
    }

    response.status(200).send({ userWallets: wallets[ownerAddress] });
});

/**----------------------
 * to add a user wallet to a list
 * ---------------------*/
app.get("/createWallet/:ownerAddress/:walletName/:walletAddress/:chainId", function (request, response) {
    const { ownerAddress, walletName, walletAddress, chainId } = request.params;
    console.log("wallets[ownerAddress]: ", wallets[ownerAddress]);

    if (wallets[ownerAddress] === undefined) {
        wallets[ownerAddress] = [];
        wallets[ownerAddress].push({
            walletName,
            walletAddress,
            chainIds: [chainId],
        });
    } else {
        let isWalletExists = wallets[ownerAddress].find((data) => data.walletAddress === walletAddress);
        // if no wallet exist then push else skip
        if (isWalletExists === undefined) {
            wallets[ownerAddress].push({
                walletName,
                walletAddress,
                chainIds: [Number(chainId)],
            });
        }
    }

    response.status(200).send(wallets[ownerAddress]);
});
/**----------------------
 * update a chainId for a address
 * ---------------------*/
app.get("/updateChainId/:ownerAddress/:walletAddress/:chainId", function (request, response) {
    const { ownerAddress, walletAddress, chainId } = request.params;

    wallets[ownerAddress].map((data) => {
        if (data.walletAddress === walletAddress) {
            // data.chainIds.push(chainId);
            data.chainIds = [...new Set([...data.chainIds, chainId])];
        }
        return data;
    });

    response.status(200).send(wallets[ownerAddress]);
});

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
