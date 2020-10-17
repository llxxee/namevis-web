# NDN Passive Name Visualizer

This repository is the web application of NDN Passive Name Visualizer.
It is meant to be used with the [server component](https://github.com/10th-ndn-hackathon/namevis).

## Installation

This project requires Node.js 14.x.
It's recommended to install Node.js via [nvm](https://github.com/nvm-sh/nvm).

To start the project:

```bash
npm install
npm start
```

You can then view the web application at `http://localhost:1234`.

By default, the web application connects to a local server at `http://127.0.0.1:6847`.
To use an alternate server, add a query string like this: `http://localhost:1234/#server=http://example.net:6847`.
