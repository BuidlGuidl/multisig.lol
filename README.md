# ๐ multisig.lol - forkable ethereum multisig 

๐ Built with [Scaffold-Eth](https://github.com/scaffold-eth/scaffold-eth)

โจ https://multisig.lol/

```bash
git clone https://github.com/BuidlGuidl/multisig.lol
```

> install and start your ๐ทโ Hardhat chain:

```bash
cd multisig.lol
yarn install
yarn chain
```

> in a second terminal window, start your ๐ฑ frontend:

```bash
cd multisig.lol
yarn start
```

> in a third terminal window, ๐ฐ deploy your contract:

```bash
cd multisig.lol
yarn deploy
```

> in a fourth terminal window, ๐ start your backend:

```bash
cd multisig.lol
yarn backend
```

๐ฑ Open http://localhost:3000 to see the app

๐ฌ Join the multisig.lol developer chat: https://t.me/+0wAfxh5Na9pkNzUx

## Experimental next-app ๐งช

In `/packages/next-app` there is an experimental next-app, which ports the functionality in `packages/backend` and `packages/react-app` into a single Typescript `next.js` app (using Next API routes for the backend).

To run this app locally:

1. Copy `/packages/next-app/example.env.local` to `/packages/next-app/.env.local`, updating the DID_KEY -> ask in the multisig.lol Telegram for the `dev` key!
2. From the root run `yarn next-app:start`
3. Go to http://localhost:3000 to see the app (you will see API calls in the console)