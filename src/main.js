import { get as hashGet } from "hashquery";
import { mount, setChildren, el } from "redom";
import { Server } from "./server.js";
import { TimeSeries } from "./timeseries.js"

const $fDevices = document.querySelector("#f_devices");
const $pPackets = document.querySelector("#p_packets");

const server = new Server(hashGet("server"));
let selectedDevice = "";

$fDevices.addEventListener("submit", (evt) => {
  evt.preventDefault();
  if (!selectedDevice) {
    return;
  }
  $fDevices.remove();

  const timeSeries = new TimeSeries();
  mount(document.querySelector("#g_timeseries"), timeSeries);

  const stream = server.liveCapture(selectedDevice);
  stream.on("packet", (packet) => {
    timeSeries.push(packet);
  });
  stream.on("close", () => console.log("close"));
});

(async () => {
  const devices = await server.listDevices();
  const $devices = [];
  for (const device of devices) {
    const $device = el("label", el("input", { type: "radio" }), device.name);
    $devices.push($device);
    $device.addEventListener("click", () => selectedDevice = device.name);
  }
  setChildren(document.querySelector("#devices"), $devices);
})().catch(console.error);
