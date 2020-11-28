import "chartjs-chart-graph";
import "chartjs-plugin-datalabels";

import * as d3 from "d3";
import { AltUri } from "@ndn/naming-convention2";
import { toHex } from "@ndn/tlv";
import { el } from "redom";

// Set the dimensions and margins of the diagram
var margin = {top: 20, right: 90, bottom: 30, left: 90},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var i = 0,
    duration = 750;




// TODO: 
// 1. use node color to show if an interest has been fulfilled
// 2. show trust relation
export class D3Tree {
  constructor() {
    this.labels = ["/"];
    this.data = [{ name: "/" }];
    this.map = new Map();
    this.clear();

    this.el = el("#canvas");

    this.treeData = {
        "name": "Top Level",
        "children": [
          { 
            "name": "Level 2: A",
            "children": [
              { "name": "Son of A" },
              { "name": "Daughter of A" }
            ]
          },
          { "name": "Level 2: B" }
        ]
      };
  }

  createTreeMap() {
    // append the this.svg object to the canvas
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    this.svg = d3.select("#canvas").append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", "translate("
            + margin.left + "," + margin.top + ")");
      // declares a tree layout and assigns the size
    this.treemap = d3.tree().size([height, width]);
  }


  onmount() {
    this.createTreeMap();

    // Assigns parent, children, height, depth
    this.root = d3.hierarchy(this.treeData, function(d) { return d.children; });
    this.root.x0 = height / 2;
    this.root.y0 = 0;
    // Assigns the x and y position for the nodes
    this.treeMapData = this.treemap(this.root);
    this.updateTree(this.root);
  }

  updateTree(source){
    // Compute the new tree layout.
    var nodes = this.treeMapData.descendants(),
    links = this.treeMapData.descendants().slice(1);

    // Normalize for fixed-depth.
    nodes.forEach(function(d){ d.y = d.depth * 180});

    // ****************** Nodes section ***************************

    // Update the nodes...
    var node = this.svg.selectAll('g.node')
        .data(nodes, function(d) {return d.id || (d.id = ++i); });

    // Enter any new modes at the parent's previous position.
    var nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr("transform", function(d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
        })
        .on('click', click);

    // Add Circle for the nodes
    nodeEnter.append('circle')
        .attr('class', 'node')
        .attr('r', 1e-6)
        .style("fill", function(d) {
            return d._children ? "lightsteelblue" : "#fff";
        });

    // Add labels for the nodes
    nodeEnter.append('text')
        .attr("dy", ".35em")
        .attr("x", function(d) {
            return d.children || d._children ? -13 : 13;
        })
        .attr("text-anchor", function(d) {
            return d.children || d._children ? "end" : "start";
        })
        .text(function(d) { return d.data.name; });

    // UPDATE
    var nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate.transition()
        .duration(duration)
        .attr("transform", function(d) {
            return "translate(" + d.y + "," + d.x + ")";
        });

    // Update the node attributes and style
    nodeUpdate.select('circle.node')
        .attr('r', 10)
        .style("fill", function(d) {
            return d._children ? "lightsteelblue" : "#fff";
        })
        .attr('cursor', 'pointer');


    // Remove any exiting nodes
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) {
            return "translate(" + source.y + "," + source.x + ")";
        })
        .remove();

    // On exit reduce the node circles size to 0
    nodeExit.select('circle')
        .attr('r', 1e-6);

    // On exit reduce the opacity of text labels
    nodeExit.select('text')
        .style('fill-opacity', 1e-6);


    // ****************** links section ***************************

    // Update the links...
    var link = this.svg.selectAll('path.link')
        .data(links, function(d) { return d.id; });

    // Enter any new links at the parent's previous position.
    var linkEnter = link.enter().insert('path', "g")
        .attr("class", "link")
        .attr('d', function(d){
            var o = {x: source.x0, y: source.y0}
            return diagonal(o, o)
        });

    // UPDATE
    var linkUpdate = linkEnter.merge(link);

    // Transition back to the parent element position
    linkUpdate.transition()
        .duration(duration)
        .attr('d', function(d){ return diagonal(d, d.parent) });

    // Remove any exiting links
    var linkExit = link.exit().transition()
        .duration(duration)
        .attr('d', function(d) {
            var o = {x: source.x, y: source.y}
            return diagonal(o, o)
        })
        .remove();

    // Store the old positions for transition.
    nodes.forEach(function(d){
        d.x0 = d.x;
        d.y0 = d.y;
    });

    // Creates a curved (diagonal) path from parent to the child nodes
    function diagonal(s, d) {
        var path = `M ${s.y} ${s.x}
                C ${(s.y + d.y) / 2} ${s.x},
                ${(s.y + d.y) / 2} ${d.x},
                ${d.y} ${d.x}`

        return path
    }

    // Toggle children on click.
    var self = this;
    function click(d) {
        console.log(typeof d);
        console.log(d);
        console.log(d.children);

        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
        self.updateTree(d);
    }
  }

  clear() {
    this.labels.splice(1, Infinity);
    this.data.splice(1, Infinity);
    this.map.clear();
    this.map.set("", 0);
    // this.chart?.update();
  }

  update({ prefixlen, suffixlen }) {
    this.prefixlen = prefixlen;
    this.suffixlen = suffixlen;
  }


  push({ name }) {
   sleepFor(10);
    console.log(this.treeData.children);
    // this.treeData.children.push({"name": "xxxx"});
    // this.root = d3.hierarchy(this.treeData, function(d) { return d.children; });
    // this.root.x0 = height / 2;
    // this.root.y0 = 0;
    // // Assigns the x and y position for the nodes
    // this.treeMapData = this.treemap(this.root);
    this.updateTree(this.root);


    // if (++this.count === 1) {
    //   this.dataset.data.pop();
    // }

    // let needUpdate = false;
    // let parent = 0;
    // for (let i = this.prefixlen; i <= name.length - this.suffixlen; ++i) {
    //   const prefix = name.getPrefix(i);
    //   const prefixHex = toHex(prefix.value);
    //   let index = this.map.get(prefixHex);
    //   if (typeof index === "undefined") {
    //     index = this.labels.length;
    //     const record = { parent };
    //     if (i === this.prefixlen) {
    //       record.name = AltUri.ofName(prefix);
    //     } else {
    //       record.name = AltUri.ofComponent(name.at(i - 1));
    //     }
    //     this.labels.push(AltUri.ofName(prefix));
    //     this.data.push(record);
    //     this.map.set(prefixHex, index);
    //     needUpdate = true;
    //   }
    //   parent = index;
    // }

    // if (needUpdate) {
    //   this.chart?.update();
    // }
  }




}


function sleepFor( sleepDuration ){
    var now = new Date().getTime();
    while(new Date().getTime() < now + sleepDuration){ /* do nothing */ } 
}


