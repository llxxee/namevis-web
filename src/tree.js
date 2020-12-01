import "chartjs-chart-graph";
import "chartjs-plugin-datalabels";

import { AltUri } from "@ndn/naming-convention2";
import { toHex } from "@ndn/tlv";
import Chart from "chart.js";
import { el } from "redom";
import { lab } from "d3";

const CHILDREN_HIDDEN = 2;
const COLLAPSED_HIDDEN = 1;
const NOT_HIDDEN = 0;

export class Tree {
  constructor() {
    this.labels = ["/"];
    this.data = [{ name: "/", type: "", signer: "", hiddenStatus: NOT_HIDDEN, rawParent: 0}];
    this.map = new Map();
    this.clear();

    this.el = el("canvas", { id: "nameTree" });
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

    var self = this;
    document.getElementById("nameTree").onclick = function(evt){
      var chartData = self.chart.data.datasets[0].data;
      var activePoints = self.chart.getElementsAtEvent(evt);
      if(activePoints.length != 0){
        var idx = activePoints[0]._index;
        if(chartData[idx].hiddenStatus == NOT_HIDDEN){
          chartData[idx].hiddenStatus = CHILDREN_HIDDEN;
        } else if(chartData[idx].hiddenStatus == CHILDREN_HIDDEN) {
          chartData[idx].hiddenStatus = NOT_HIDDEN;
        }

        console.log("chartData after click" + chartData[idx].hiddenStatus);
        console.log(chartData);
        self.hideHiddenDataInChart(self.data, self.labels, self.chart);
      }
      self.chart?.update();
    };
  }
///////////////////////////////////////////////////////////////////////////

// TODO: this is totally messed
///////////////////////////////////////////////////////////////////////////
  hideHiddenDataInChart(rawData, rawLabels, chart) {
    var newData = [];
    var newLabels = [];
    var indexMap = {};
    console.log("rawData in hide");
    console.log(rawData);
    newData.push(rawData[0]);
    newLabels.push(rawLabels[0]);
    indexMap[0] = 0;
    var newIdx = 1;
    

    for (let i = 1; i < rawData.length; ++i) {
      if(rawData[i].hiddenStatus == CHILDREN_HIDDEN)
        continue;
      var rawParent = rawData[i].rawParent;
      if(rawData[rawParent].hiddenStatus == NOT_HIDDEN) {
        rawData[i].hiddenStatus = NOT_HIDDEN;
      } else {
        rawData[i].hiddenStatus = COLLAPSED_HIDDEN;
      }
    }
    console.log("updated hidden status: ");
    console.log(rawData);
    for (let i = 1; i < rawData.length; ++i) {
      var rawParent = rawData[i].rawParent;
      if(rawData[i].hiddenStatus != COLLAPSED_HIDDEN
        && rawData[rawParent].hiddenStatus == NOT_HIDDEN){
        indexMap[i] = newIdx;
        var rawParent = rawData[i].rawParent;
        rawData[i].parent = indexMap[rawParent];
        newData.push(rawData[i]);
        newLabels.push(rawLabels[i]);
        newIdx++;
      }
    }
    console.log("new");
    console.log(newData);
    console.log(newLabels);
    chart.data.labels = newLabels;
    chart.data.datasets[0].data = newData;
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
        record.hiddenStatus = NOT_HIDDEN;
        record.rawParent = parent;
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
      // TODO: update hiddenStatus
      this.chart?.update();
    }
  }
}

// TODO: 
// 1. use node color to show if an interest has been fulfilled
// 2. show trust relation
