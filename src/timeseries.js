import Chart from "chart.js";
import { el } from "redom";

export class TimeSeries {
  constructor() {
    this.interestPacket = [];
    this.dataPacket = [];
    this.clear();
    this.el = el("canvas");
  }

  onmount() {
    this.chart = new Chart(this.el, {
      type: "line",
      data: {
        datasets: [
          {
            label: "#interest packets",
            borderColor: "orange",
            data: this.interestPacket,
          },
          {
            label: "#data packets",
            borderColor: "green",
            data: this.dataPacket,
          },
        ],
      },
      options: {
        aspectRatio: 1.5,
        legend: {
          display: true,
        },
        scales: {
          xAxes: [{
            type: "time",
            display: true,
            time: {
              displayFormats: {
                second: "MM-DD HH:mm:ss",
              },
              unit: "second",
            },
          }],
        },
        plugins: {
          datalabels: {
            display: false,
          },
        },
      },
    });
  }

  clear() {
    this.second = 0;
    this.interestCount = 0;
    this.dataCount = 0;
    this.interestPacket.splice(0, Infinity);
    this.chart?.update();
  }

  push({ timestamp,  type}) {
    // TODO: delete
    console.log("ts time stamp" + timestamp);
    console.log("ts packet type" + type);

    const sec = (timestamp.getTime() / 1000).toFixed(0);
    if (this.second === 0) {
      this.second = sec;
    }

    let needUpdate = false;
    // update the current time til the latest packet time
    while (this.second < sec) {
      this.interestPacket.push({
        t: new Date(this.second * 1000),
        y: this.interestCount
      });
      this.dataPacket.push({
        t: new Date(this.second * 1000),
        y: this.dataCount
      })
      ++this.second;
      this.dataCount = 0;
      this.interestCount = 0;
      needUpdate = true;
    }
    if (needUpdate) {
      // TODO: support time range selection
      // while (this.interestPacket.length > 300) {
      //   this.interestPacket.shift();
      // }
      this.chart?.update();
    }

    if(type == "I"){
      console.log("find interest packet")
      ++this.interestCount;
    }
    else{
      ++this.dataCount;
    }
  }
}
