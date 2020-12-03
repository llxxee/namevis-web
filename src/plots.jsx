import { AltUri } from "@ndn/naming-convention2";
import { el, h } from "redom";

import { TimeSeries } from "./timeseries.js"; // eslint-disable-line no-unused-vars
import { Tree } from "./tree.js"; // eslint-disable-line no-unused-vars

export class Plots {
  constructor() {
    <div this="el" class="pure-g">
      <div class="pure-u-1">
        <h3 style="text-align:center">Time Range</h3>
        <input this="$timeRangePicker" id="timeRangePicker" style="width:100%; text-align:center;"/>
      </div>
      <div class="pure-u-1-2">
        <h3>Packet Throughput</h3>
        <TimeSeries this="$timeseries"/>
      </div>
      <div class="pure-u-1-2">
        <h3 style="text-align:center">Recent Packets</h3>
        <p style="text-align:center"><i><b>(I): Interest packet; (D): Data packet</b></i></p>
        <pre this="$recents" style="text-align:center">recent packets</pre>
      </div>
      <div class="pure-u-1">
        <h3>Namespace Tree</h3>
        <Tree this="$tree"/>
      </div>
      <div class="pure-u-1">
        <button this="$stop" class="pure-button">Stop</button>
        <button this="$exit" class="pure-button" disabled>Exit</button>
      </div>
    </div>;

    this.timeFilterStart = moment().startOf('hour').subtract(30, 'day');
    this.timeFilterEnd = moment().startOf('hour').add(30, 'day');
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
    this.$timeseries.updateTimeRange(this.timeFilterStart, this.timeFilterEnd);
    this.$tree.updateTimeRange(this.timeFilterStart, this.timeFilterEnd);
    this.$tree.update({ prefixlen, suffixlen });
    this.stream?.on("packet", (packet) => this.push(packet));
    this.exit = exit;
  }

  stop() {
    this.stream?.close();
  }

  // update the tree and the time series graph
  push(packet) {
    this.$timeseries.push(packet);
    this.$tree.push(packet);
    this.recents.push("(" + packet.type + ") " + AltUri.ofName(packet.name));
    while (this.recents.length > 20) {
      this.recents.shift();
    }
    this.$recents.textContent = this.recents.join("\n");
  }

  addTimeRangePicker() {
    var self = this;
    $('#timeRangePicker').daterangepicker({
      opens: 'center',
      timePicker: true,
      startDate: this.timeFilterStart,
      endDate: this.timeFilterEnd,
      locale: {
        format: 'M/DD hh:mm A'
      }
    }, function(start, end, label) {
      self.timeFilterStart = start.toDate();
      self.timeFilterEnd = end.toDate();
      self.$timeseries.updateTimeRange(self.timeFilterStart, self.timeFilterEnd);
      self.$tree.updateTimeRange(self.timeFilterStart, self.timeFilterEnd);
      console.log("A new date selection was made: "
                  + self.timeFilterStart
                  + ' to ' + self.timeFilterEnd);
    });
  }

}
