import "purecss";
import "./style.css";

import { el, mount, router } from "redom";

import { ConnectForm } from "./connect-form.jsx";
import { Plots } from "./plots.jsx";
import { Server } from "./server.js";
import { StartForm } from "./start-form.jsx";

let server;

const app = router(".app", {
  connect: ConnectForm,
  start: StartForm,
  plots: Plots,
});
mount(document.body, (
  <div>
    {app}
    <footer>
      <a href="https://github.com/10th-ndn-hackathon/namevis-web" target="_blank">NDN Passive Name Visualizer</a>, powered by NDNgo
    </footer>
  </div>
));

app.update("connect", {
  callback: selectServer,
});

async function selectServer(serverUri) {
  if (serverUri) {
    server = new Server(serverUri);
  }
  const [devices, files] = await Promise.all([
    server.listDevices(),
    server.listFiles(),
  ]);
  app.update("start", {
    devices,
    files,
    callback: startPlots,
  });
}

function startPlots({ device, file, prefixlen, suffixlen }) {
  const stream = device ?
                 server.liveCapture(device, prefixlen, suffixlen)
                 : server.readPcap(file, prefixlen, suffixlen);
  app.update("plots", {
    stream,
    prefixlen,
    suffixlen,
    exit: () => selectServer(undefined),
  });
}
