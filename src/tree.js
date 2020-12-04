import "chartjs-chart-graph";
import "chartjs-plugin-datalabels";

import { AltUri } from "@ndn/naming-convention2";
import { toHex } from "@ndn/tlv";
import Chart from "chart.js";
import { el } from "redom";
import { lab } from "d3";

const OUT_OF_TIME_RANGE = 3;
const CHILDREN_HIDDEN = 2;
const COLLAPSED_HIDDEN = 1;
const NOT_HIDDEN = 0;

var signerColorMap = new Map();

export class Tree {
  constructor() {
    this.labels = ["/"];
    this.data = [{
      name: "/",
      type: "",
      signer: null,
      hiddenStatus: NOT_HIDDEN,
      rawParent: 0,
      timestamps: [],
      wholeName: "/",
    }];
    this.map = new Map();
    this.indexMap = new Map();
    this.clear();
    this.startTime = null;
    this.endTime = null;
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
                return "rgba(240,232,120,0.97)";
              } else if(record.type.includes("K")) {
                // blue background if it's an interest for key
                return "#8DB2FC";
              }
            },
            pointBorderColor: function(ctx) {
              var record = ctx.dataset.data[ctx.dataIndex];
              // mark the border according to key name
              if(record.signer && AltUri.ofName(record.signer) != "/"){
                return signerColorMap.get(AltUri.ofName(record.signer));
              }
              if(record.type.includes("K")){
                return signerColorMap.get(record.wholeName);
              }
              if(record.type.includes("D")) {
                // green border if data packet and not signed
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
        self.hideHiddenDataInChart(self.data, self.labels, self.indexMap, self.chart);
      }
      self.chart?.update();
    };
  }

  hideHiddenDataInChart(rawData, rawLabels, indexMap, chart) {
    var newData = [];
    var newLabels = [];
    console.log("rawData in hide");
    console.log(rawData);
    newData.push(rawData[0]);
    newLabels.push(rawLabels[0]);
    indexMap.set(0, 0);
    var newIdx = 1;

    for (let i = 1; i < rawData.length; ++i) {
      var rawParent = rawData[i].rawParent;
      if(rawData[rawParent].hiddenStatus == OUT_OF_TIME_RANGE) {
        rawData[i].hiddenStatus = OUT_OF_TIME_RANGE;
        continue;
      }
      var isOut = isOutOfTimeRange(rawData[i].timestamps,
                    this.startTime, this.endTime);
      if(isOut) {
        rawData[i].hiddenStatus = OUT_OF_TIME_RANGE;
        continue;
      }
      if(rawData[i].hiddenStatus == CHILDREN_HIDDEN)
        continue;
      if(rawData[rawParent].hiddenStatus == NOT_HIDDEN) {
        rawData[i].hiddenStatus = NOT_HIDDEN;
      } else {
        rawData[i].hiddenStatus = COLLAPSED_HIDDEN;
      }
    }
    // console.log("updated hidden status: ");
    // console.log(rawData);
    for (let i = 1; i < rawData.length; ++i) {
      var rawParent = rawData[i].rawParent;
      if(rawData[i].hiddenStatus != COLLAPSED_HIDDEN
        && rawData[rawParent].hiddenStatus == NOT_HIDDEN
        && rawData[i].hiddenStatus != OUT_OF_TIME_RANGE) {
        indexMap.set(i, newIdx);
        var rawParent = rawData[i].rawParent;
        rawData[i].parent = indexMap.get(rawParent);
        newData.push(rawData[i]);
        newLabels.push(rawLabels[i]);
        newIdx++;
      }
    }
    // console.log("new");
    // console.log(newData);
    // console.log(newLabels);
    chart.data.labels = newLabels;
    chart.data.datasets[0].data = newData;
  }

  clear() {
    this.labels.splice(1, Infinity);
    this.data.splice(1, Infinity);
    this.map.clear();
    this.map.set("", 0);
    this.indexMap.clear();
    this.chart?.update();
  }

  update({ prefixlen, suffixlen }) {
    this.prefixlen = prefixlen;
    this.suffixlen = suffixlen;
  }

  updateTimeRange(startTime, endTime) {
    console.log("update time range in tree graph, start " + startTime
                + " end " + endTime);
    this.startTime = startTime;
    this.endTime = endTime;
    this.hideHiddenDataInChart(this.data, this.labels, this.indexMap, this.chart);
    this.chart?.update();
  }

  push({ name, type, signer, timestamp }) {
    let needUpdate = false;
    let rawParent = 0;
    var inTimeRange = (timestamp >= this.startTime && timestamp <= this.endTime);
    for (let i = this.prefixlen; i <= name.length - this.suffixlen; ++i) {
      const prefix = name.getPrefix(i);
      const prefixHex = toHex(prefix.value);
      let index = this.map.get(prefixHex);
      if (typeof index === "undefined") {
        index = this.labels.length;
        const record = {
          "type": "",
          "signer": "",
          "hiddenStatus": null,
          "rawParent": rawParent,
          "timestamps": [timestamp],
          "parent": null,
        };
        // set hiddenStatus
        if(inTimeRange) {
          if(this.data[rawParent].hiddenStatus == COLLAPSED_HIDDEN
            || this.data[rawParent].hiddenStatus == CHILDREN_HIDDEN)
            record.hiddenStatus = COLLAPSED_HIDDEN;
          else
            record.hiddenStatus = NOT_HIDDEN;
        } else {
          record.hiddenStatus = OUT_OF_TIME_RANGE;
        }

        if (i == this.prefixlen) {
          record.name = AltUri.ofName(prefix);
        } else {
          record.name = AltUri.ofComponent(name.at(i - 1));
        }

        var label = AltUri.ofName(prefix);
        label += (", first seen at " + getDateTimeString(timestamp));
        this.labels.push(label);
        this.data.push(record);
        this.map.set(prefixHex, index);
        if(record.hiddenStatus == NOT_HIDDEN) {
          // add to chart data
          record.parent = this.indexMap.get(rawParent);
          this.indexMap.set(this.data.length-1, this.chart.data.datasets[0].data.length);
          this.chart.data.datasets[0].data.push(record);
          this.chart.data.labels.push(label);
        }
        needUpdate = true;
      }

      if(i == name.length) {
        // record the packet type on the last node
        this.data[index].type += type;
        // record the signer info on the last packet
        this.data[index].signer = signer;
        this.data[index].wholeName = AltUri.ofName(name);
        // update the label with signer info
        if(signer && type == "D") {
          var signerName = AltUri.ofName(signer);
          if(!signerColorMap.has(signerName))
            signerColorMap.set(signerName, getRandomColor());
          this.labels[index] += (", signed by " + signerName);
          this.chart.data.labels[this.indexMap.get(index)] = this.labels[index];
        }
        needUpdate = true;
      }

      rawParent = index;
      // record all the timestamps associated with each node
      this.data[rawParent].timestamps.push(timestamp);

      // add to the chart data
      if(inTimeRange && this.data[rawParent].hiddenStatus == OUT_OF_TIME_RANGE) {
        this.data[rawParent].hiddenStatus = NOT_HIDDEN;
        this.indexMap.set(rawParent, this.chart.data.datasets[0].data.length);
        var rawParentofParent = this.data[rawParent].rawParent;
        this.data[rawParent] = this.indexMap.get(rawParentofParent);
        this.chart.data.datasets[0].data.push(this.data[rawParent]);
        this.chart.data.labels.push(this.labels[rawParent]);
        needUpdate = true;
      }
    }

    if (needUpdate) {
      this.chart?.update();
    }
  }
}


function getDateTimeString(timestamp){
  return timestamp.toLocaleDateString(
    undefined, {year: 'numeric', month: 'short', day: 'numeric' }
  ) + " " + timestamp.toLocaleTimeString();
}


function isOutOfTimeRange(timestamps, startTime, endTime) {
  for(let i = 0; i < timestamps.length; ++i) {
    if(timestamps[i] >= startTime && timestamps[i] <= endTime)
      return false;
  }
  return true;
}


function getRandomColor() {
  var r = (Math.random()*250).toFixed(0);
  var g = (Math.random()*250).toFixed(0);
  var b = (Math.random()*250).toFixed(0);
  return "rgba("+r+","+g+","+b+",1)";
}