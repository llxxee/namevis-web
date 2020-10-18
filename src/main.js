import { get as hashGet } from "hashquery";
import { el, mount, setChildren } from "redom";

import { Server } from "./server.js";
import { TimeSeries } from "./timeseries.js";
import { Tree } from "./tree.js";

const $fDevices = document.querySelector("#f_devices");
const $tPrefix = document.querySelector("#t_prefix");
const $tSuffix = document.querySelector("#t_suffix");

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
  const tree = new Tree({
    collapsePrefixLength: Number.parseInt($tPrefix.value, 10),
    stripSuffixLength: Number.parseInt($tSuffix.value, 10),
  });
  mount(document.querySelector("#g_tree"), tree);

  const stream = server.liveCapture(selectedDevice);
  stream.on("packet", (packet) => {
    timeSeries.push(packet);
    tree.push(packet);
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
