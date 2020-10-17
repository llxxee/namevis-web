import { AltUri } from "@ndn/naming-convention2";
import dayjs from "dayjs";
import { setChildren, el } from "redom";
import { Server } from "./server.js";

const $fDevices = document.querySelector("#f_devices");
const $pPackets = document.querySelector("#p_packets");

const server = new Server();
let selectedDevice = "";

$fDevices.addEventListener("submit", (evt) => {
  evt.preventDefault();
  if (!selectedDevice) {
    return;
  }
  $fDevices.remove();

  const stream = server.liveCapture(selectedDevice);
  stream.on("packet", ({ timestamp, name, type }) => {
    const dt = dayjs(timestamp);
    $pPackets.textContent += `\n${dt.format("HH:mm:ss")} ${type} ${AltUri.ofName(name)}`
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
