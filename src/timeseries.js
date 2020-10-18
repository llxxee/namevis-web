import Chart from "chart.js";
import { el } from "redom";

export class TimeSeries {
  constructor() {
    this.second = 0;
    this.count = 0;

    this.el = el("canvas");
    this.dataset = { data: [] };
    this.chart = new Chart(this.el, {
      type: "line",
      data: {
        datasets: [this.dataset],
      },
      options: {
        legend: {
          display: false,
        },
        scales: {
          xAxes: [{
            type: "time",
            display: true,
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

  push({ timestamp }) {
    const sec = (timestamp.getTime() / 1000).toFixed(0);
    if (this.second === 0) {
      this.second = sec;
    }

    let needUpdate = false;
    while (this.second < sec) {
      this.dataset.data.push({
        t: new Date(this.second * 1000),
        y: this.count,
      });
      ++this.second;
      this.count = 0;
      needUpdate = true;
    }
    if (needUpdate) {
      while (this.dataset.data.length > 300) {
        this.dataset.data.shift();
      }
      this.chart.update();
    }

    ++this.count;
  }
}
