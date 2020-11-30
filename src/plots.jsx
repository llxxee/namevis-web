import { AltUri } from "@ndn/naming-convention2";
import { el, h } from "redom";

import { TimeSeries } from "./timeseries.js"; // eslint-disable-line no-unused-vars
import { Tree } from "./tree.js"; // eslint-disable-line no-unused-vars
import { D3Tree } from "./d3tree.js";

export class Plots {
  constructor() {
    <div this="el" class="pure-g">
      <div class="pure-u-1-2">
        <h3 style="text-align:center">Time Range</h3>
        <input type="checkbox" this="$noEnd" name="no end time"/>
        <label for="no end time"> Up to the latest packet</label>
        <input this="$timeRangePicker" id="timeRangePicker"/>
      </div>
      <div class="pure-u-1-2">
        <h3>Packet Throughput</h3>
        <TimeSeries this="$timeseries"/>
      </div>
      <div class="pure-u-1">
        <h3>Namespace Tree</h3>
        <Tree this="$tree"/>
      </div>
      <div class="pure-u-1-2">
        <h3>Namespace Tree</h3>
        <D3Tree this="$d3tree"/>
      </div>
      <div class="pure-u-1">
        <h3>Recent Packets</h3>
        <p><i><b>(I): Interest packet; (D): Data packet</b></i></p>
        <pre this="$recents">recent packets</pre>
      </div>
      <div class="pure-u-1">
        <button this="$stop" class="pure-button">Stop</button>
        <button this="$exit" class="pure-button" disabled>Exit</button>
      </div>
    </div>;

    this.recents = [];
    this.stopped = true;
    this.$stop.addEventListener("click", (evt) => {
      evt.preventDefault();
      this.stop();
      this.$stop.disabled = true;
      this.$exit.disabled = false;
    });
    this.$exit.addEventListener("click", (evt) => {
      evt.preventDefault();
      this.exit?.();
    });
  }

  update({ stream, prefixlen, suffixlen, exit }) {
    this.stop();
    this.addTimeRangePicker();
    this.stream = stream;
    // TODO: del
    this.$tree.update({ prefixlen, suffixlen });
    this.$d3tree.update({ prefixlen, suffixlen });
    this.stream?.on("packet", (packet) => this.push(packet));
    this.exit = exit;
  }

  stop() {
    this.stream?.close();
  }

  // update the tree and the time series graph
  push(packet) {
    // TODO: delete
    console.log("received packet from websocket");

    this.$timeseries.push(packet);
    // TODO: del
    this.$tree.push(packet);
    this.$d3tree.push(packet);
    this.recents.push(AltUri.ofName(packet.name) + " (" + packet.type + "), "
                      + packet.timestamp);
    while (this.recents.length > 1000) {
      this.recents.shift();
    }
    this.$recents.textContent = this.recents.join("\n");
  }

  addTimeRangePicker() {
    $('#timeRangePicker').daterangepicker({
      opens: 'left'
    }, function(start, end, label) {
      console.log("A new date selection was made: " + start.format('YYYY-MM-DD') + ' to ' + end.format('YYYY-MM-DD'));
    });
  }

}
