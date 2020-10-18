import "purecss";
import "./style.css";

import { el, mount, router } from "redom";

import { CaptureForm } from "./capture-form.jsx";
import { ConnectForm } from "./connect-form.jsx";
import { Plots } from "./plots.jsx";
import { Server } from "./server.js";

let server;

const app = router(".app", {
  connect: ConnectForm,
  capture: CaptureForm,
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
  const devices = await server.listDevices();
  app.update("capture", {
    devices,
    callback: startCapture,
  });
}

function startCapture({ device, prefixlen, suffixlen }) {
  const stream = server.liveCapture(device);
  app.update("plots", {
    stream,
    prefixlen,
    suffixlen,
    exit: () => selectServer(undefined),
  });
}
