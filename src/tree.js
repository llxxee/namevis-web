import "chartjs-chart-graph";
import "chartjs-plugin-datalabels";

import { AltUri } from "@ndn/naming-convention2";
import { toHex } from "@ndn/tlv";
import Chart from "chart.js";
import { el } from "redom";
import { lab } from "d3";

export class Tree {
  constructor() {
    this.labels = ["/"];
    this.data = [{ name: "/", type: "", signer: ""}];
    this.map = new Map();
    this.clear();

    this.el = el("canvas");
  }

  onmount() {
    this.chart = new Chart(this.el, {
      type: "tree",
      data: {
        labels: this.labels,
        datasets: [
          {
            data: this.data,
            pointRadius: 20,
            pointBorderWidth: 3,
            // pointBackgroundColor: 0,
            pointHoverRadius: 15,
            pointBackgroundColor: function(ctx) {
              var record = ctx.dataset.data[ctx.dataIndex];
              if(record.type.includes("I")) {
                // yellow background if interest packet
                return "#CFB56D";
              } else if(record.type.includes("K")) {
                // blue background if it's an interest for key
                return "#8DB2FC";
              }
            },
            pointBorderColor: function(ctx) {
              var record = ctx.dataset.data[ctx.dataIndex];
              console.log("record");
              console.log(record);
              if(record.type.includes("D")) {
                // green border if data packet
                return "#599970";
              }
            }
          },
        ],
      },
      options: {
        aspectRatio: 2,
        legend: {
          display: false,
        },
        tree: {
          orientation: "horizontal",
        },
        layout: {
          padding: {
              left: 50,
              right: 90,
              top: 0,
              bottom: 0
          }
        },
        plugins: {
          datalabels: {
            formatter: (v) => v.name,
          },
        },
      },
    });
  }

  clear() {
    this.labels.splice(1, Infinity);
    this.data.splice(1, Infinity);
    this.map.clear();
    this.map.set("", 0);
    this.chart?.update();
  }

  update({ prefixlen, suffixlen }) {
    this.prefixlen = prefixlen;
    this.suffixlen = suffixlen;
  }

  push({ name, type, signer }) {
    console.log("received type" + type);
    // if (++this.count === 1) {
    //   this.dataset.data.pop();
    // }
    let needUpdate = false;
    let parent = 0;
    for (let i = this.prefixlen; i <= name.length - this.suffixlen; ++i) {
      const prefix = name.getPrefix(i);
      const prefixHex = toHex(prefix.value);
      let index = this.map.get(prefixHex);
      if (typeof index === "undefined") {
        index = this.labels.length;
        const record = { parent };
        if (i == this.prefixlen) {
          record.name = AltUri.ofName(prefix);
        } else {
          record.name = AltUri.ofComponent(name.at(i - 1));
        }
        record.type = "";
        record.signer = "";
        var label = AltUri.ofName(prefix);
        if(signer) {
          label += (", signed by " + signer);
        }
        this.labels.push(label);
        this.data.push(record);
        this.map.set(prefixHex, index);
        needUpdate = true;
      }

      if(i == name.length) {
        // record the packet type on the last node
        this.data[index].type += type;
        // record the signer info on the last packet
        this.data[index].signer += signer;
      }

      parent = index;
    }

    if (needUpdate) {
      this.chart?.update();
    }
  }
}

// TODO: 
// 1. use node color to show if an interest has been fulfilled
// 2. show trust relation
