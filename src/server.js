import { Name } from "@ndn/packet";
import mitt from "mitt";

export class Server {
  constructor(uri = "http://127.0.0.1:6847") {
    this.uri = uri;
  }

  async listDevices() {
    const response = await fetch(`${this.uri}/devices.json`);
    return response.json();
  }

  async listFiles() {
    const response = await fetch(`${this.uri}/files.json`);
    return response.json();
  }

  liveCapture(device) {
    return this.openWebSocket(`/live.websocket?device=${encodeURIComponent(device)}`);
  }

  readPcap(filename) {
    return this.openWebSocket(`/file.websocket?filename=${encodeURIComponent(filename)}`);
  }

  openWebSocket(path) {
    const emitter = mitt();
    const ws = new WebSocket(`${this.uri.replace(/^http/, "ws")}${path}`);
    ws.addEventListener("message", (ev) => {
      const j = JSON.parse(ev.data);
      j.timestamp = new Date(j.timestamp);
      j.name = new Name(j.name);
      // TODO:
      j.signer = "alice/key/TODO";

      emitter.emit("packet", j);
      if(j.signer) {
        // add key packet (type: K, Key interest not satisfied)
        var keyPacket = {
          name: new Name(j.signer),
          timestamp: j.timestamp,
          signer: "",
          type: "K"
        };
        emitter.emit("packet", keyPacket);
      }

    });
    ws.addEventListener("close", () => {
      emitter.emit("close");
    });
    emitter.close = () => {
      ws.close();
    };
    return emitter;
  }
}
