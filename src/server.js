import { Name } from "@ndn/packet";
import mitt from "mitt";

export class Server {
  constructor(uri = "http://127.0.0.1:6847") {
    this.uri = uri;
  }

  async listDevices() {
    const response = await fetch(`${this.uri}/devices.json`);
    const j = await response.json();
    return j;
  }

  liveCapture(device) {
    const emitter = mitt();
    const ws = new WebSocket(`${this.uri.replace(/^http/, "ws")}/live.websocket?device=${encodeURIComponent(device)}`);
    ws.onmessage = (ev) => {
      const j = JSON.parse(ev.data);
      j.timestamp = new Date(j.timestamp);
      j.name = new Name(j.name);
      emitter.emit("packet", j);
    };
    ws.onclose = () => {
      emitter.emit("close");
    };
    emitter.close = () => {
      ws.close();
    };
    return emitter;
  }
}
