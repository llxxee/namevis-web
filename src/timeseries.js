import Chart from "chart.js";
import { el } from "redom";

export class TimeSeries {
  constructor() {
    this.interestPacket = [];
    this.dataPacket = [];
    this.clear();
    this.el = el("canvas");
    this.startTime = null;
    this.endTime = null;
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
          yAxes : [{
            ticks : {
                min : 0
            },
            scaleLabel: {
              display: true,
              labelString: '#packets/second'
            }
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

  updateTimeRange(startTime, endTime) {
    console.log("update time range start " + startTime + " end " + endTime);
    this.startTime = startTime;
    this.endTime = endTime;
    var filteredDataPacket = [];
    var filteredInterestPacket = [];
    for (let i = 0; i < this.interestPacket.length; ++i) {
      var p = this.interestPacket[i];
      if (p.t >= this.startTime && p.t <= this.endTime) {
          filteredInterestPacket.push(p);
      }
    }
    for(let j = 0; j < this.dataPacket.length; ++j) {
      var p = this.dataPacket[j];
      if (p.t >= this.startTime && p.t <= this.endTime) {
          filteredDataPacket.push(p);
        }
    }
    this.chart.data.datasets[0].data = filteredInterestPacket;
    this.chart.data.datasets[1].data = filteredDataPacket;
    this.chart?.update();
  }

  clear() {
    this.second = 0;
    this.interestCount = 0;
    this.dataCount = 0;
    this.interestPacket.splice(0, Infinity);
    this.chart?.update();
  }

  push({ timestamp,  type, count}) {
    // TODO: delete
    console.log("ts time stamp" + timestamp);
    console.log("ts packet type" + type);

    // const sec = (timestamp.getTime() / 1000).toFixed(0);
    const sec = Math.floor(timestamp.getTime() / 1000);
    if (this.second === 0) {
      this.second = sec;
    }

    let needUpdate = false;
    // update the current time til the latest packet time
    while (this.second < sec) {
      var currentTime = new Date(this.second * 1000);
      console.log("adding this second ");
      console.log(currentTime)
      var interestP = {
        t: currentTime,
        y: this.interestCount
      };
      var dataP = {
        t: currentTime,
        y: this.dataCount
      };
      if(currentTime <= this.endTime) {
        this.chart.data.datasets[0].data.push(interestP);
        this.chart.data.datasets[1].data.push(dataP);
      }
      this.interestPacket.push(interestP);
      this.dataPacket.push(dataP);
      console.log(this.interestPacket);
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
      this.interestCount += count;
    }
    else if(type == "D"){
      this.dataCount += count;
    }
  }
}
