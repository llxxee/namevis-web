// eslint-disable-next-line import/no-unassigned-import
import "chartjs-chart-graph";
// eslint-disable-next-line import/no-unassigned-import
import "chartjs-plugin-datalabels";

import { AltUri } from "@ndn/naming-convention2";
import { toHex } from "@ndn/tlv";
import Chart from "chart.js";
import { el } from "redom";

export class Tree {
  constructor({ collapsePrefixLength = 0, stripSuffixLength = 0 }) {
    this.collapsePrefixLength = collapsePrefixLength;
    this.stripSuffixLength = stripSuffixLength;

    this.el = el("canvas");
    this.dataset = { data: [{ name: "/" }] };
    this.labels = ["/"];
    this.map = new Map();
    this.map.set("", 0);
    this.chart = new Chart(this.el, {
      type: "tree",
      data: {
        labels: this.labels,
        datasets: [this.dataset],
      },
      options: {
        legend: {
          display: false,
        },
        tree: {
          orientation: "vertical",
        },
        plugins: {
          datalabels: {
            formatter: (v) => v.name,
          },
        },
      },
    });
  }

  push({ name }) {
    if (++this.count === 1) {
      this.dataset.data.pop();
    }

    let needUpdate = false;
    let parent = 0;
    for (let i = this.collapsePrefixLength; i <= name.length - this.stripSuffixLength; ++i) {
      const prefix = name.getPrefix(i);
      const prefixHex = toHex(prefix.value);
      let index = this.map.get(prefixHex);
      if (typeof index === "undefined") {
        index = this.dataset.data.length;
        const record = { parent };
        if (i === this.collapsePrefixLength) {
          record.name = AltUri.ofName(prefix);
        } else {
          record.name = AltUri.ofComponent(name.at(i - 1));
        }
        this.labels.push(AltUri.ofName(prefix));
        this.dataset.data.push(record);
        this.map.set(prefixHex, index);
        needUpdate = true;
      }
      parent = index;
    }

    if (needUpdate) {
      this.chart.update();
    }
  }
}
