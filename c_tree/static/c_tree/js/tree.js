/**
 * Created by yarnaid on 22/04/2015.
 */

var Tree = function(_parent_id, _data, _event_handler) {
    var self = this;
    self.parent_id = _parent_id;
    self.data = _data;
    self.event_handler = _event_handler;
    self.margin = {
        top: 10,
        bottom: 200,
        left: 0,
        right: 0
    };
    self.i = 0;
    self.min_r = 3;
    self.t_offset = 13;
    self.duration = 400;

    self.rect_height = 32;
    self.rect_width = 120;
    self.rect_rx = self.rect_height / 2;
    self.rect_ry = self.rect_rx;

    this.width = $(this.parent_id).width() - this.margin.left - this.margin.right;
    this.height = $(this.parent_id).height();
    this.height = Math.max(window.innerHeight, this.height);
    this.height = this.height - this.margin.top - this.margin.bottom;

    self.scale = d3.scale.log().range([self.min_r, self.rect_height / 2 * 0.7]).domain([1, 200]);
    self.radius = function(node) {
        var res = 0;
        if (node) {
            res = self.scale(node.verbatim_count);
        }
        return res;
    };

    self.fill = d3.scale.category20();
    self.depth_scale = d3.scale.linear().range([10, self.width]);

    self.zoom = d3.behavior.zoom();

    self.tree = d3.layout.tree()
        .size([self.height, self.width]);

    self.diagonal = d3.svg.diagonal()
        .projection(function(d) {
            return [d.y + self.rect_width/3, d.x];
        });


    self.init();
};


Tree.prototype.init = function() {
    var self = this;
    self.helpers_init();

    var zoom = function() {
        self.svg.attr('transform', 'translate(' + self.zoom.translate() + ') scale(' + self.zoom.scale() + ')');
    };

    self.svg = d3.select(self.parent_id)
        .append('svg')
        .attr('class', 'tree')
        .attr('width', self.width)
        .attr('height', self.height)
        .attr('pointer-events', 'all')
        .append('svg:g')
        .call(self.zoom.on('zoom', zoom))
        .append('svg:g')
        .attr('transform', 'translate(' + self.margin.left + ',' + self.margin.top + ')');

    self.process_data();
    self.display_data.x0 = self.height / 2. + self.margin.left;
    self.display_data.y0 = 0;
    self.update(self.display_data);
};

Tree.prototype.process_data = function() {
    var self = this;
    return this.display_data = this.data;

    var job_name = 'Job Name';
    var root = {
        parent: null,
        name: job_name,
        cluster: null,
        effecif: self.min_r,
        overcode: true
    };
};

Tree.prototype.update = function(source) {
    var self = this;
    var nodes = self.tree.nodes(self.display_data.question).reverse();
    var links = self.tree.links(nodes);

    var max_depth = 2;
    self.depth_scale.domain([0, (max_depth + 1) * 180]);

    nodes.forEach(function(d) {
        d.y = self.depth_scale(d.depth * 180);
    });

    var node = self.svg.selectAll('g.node')
        .data(nodes, function(d) {
            if (d.depth < 2) {
                d.overcode = true;
            }
            return d.id || (d.id = ++(self.i));
        });

    function click(d) {
        if (!d.overcode) {
            self.show_verbatims(d);
        } else {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }
            self.update(d);
        }
    }

    var nodeEnter = node.enter().append('g')
        .attr('class', function(d) {
            return d.overcode? 'node overcode' : 'node code';
        })
        .attr('transform', function(d) {
            return 'translate(' + source.y0 + ',' + source.x0 + ')'
        })
        .on("mouseover", function(d) {
            self.tooltip_elem.transition()
                .duration(self.duration)
                .style("opacity", 1);
            self.tooltip_elem.html(self.tooltip_html(d))
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
            // .style("cursor", function () {return !d.overcode ? "pointer" : "default";});
        })
        .on("mouseout", function(d) {
            self.tooltip_elem.transition()
                .duration(self.duration)
                .style("opacity", 0);
        })
        .on('click', click);

    nodeEnter.append('rect')
        .attr('height', 1e-6) // function(d) {
    // return Math.max(self.radius(d), self.min_r) || self.min_r;
    // })
    .attr("rx", self.rect_rx)
        .attr("ry", self.rect_ry);

    nodeEnter.append('circle')
            .attr('class', function(d) {
                var c = d.overcode ? 'overcode' : 'code';
                return 'node ' + c;
            })
            .attr('r', function(d) {
                return self.radius(d);
            })
            .attr('cx', self.rect_height/2);


    nodeEnter.append('text')
        .attr('x', function(d) {
            return self.rect_height;
            return d.children.length || d._children ? 30 + self.radius(d) + self.t_offset : self.radius(d) + self.t_offset;
        })
        .attr('dy', '.35em')
        .attr('text-anchor', 'start')
        .text(function(d) {
            return d.text;
        })
        .style('fill-opacity', 1e-6);

    var nodeUpdate = node.transition()
        .duration(self.duration)
        .attr("transform", function(d) {
            return "translate(" + d.y + "," + d.x + ")";
        });

    nodeUpdate.select("rect")
    // .attr("height", function(d) {
    //       return Math.max(self.radius(d), self.min_r) || self.min_r;
    //   })
    .attr("height", self.rect_height)
        .attr("width", self.rect_width)
        .attr("y", -self.rect_height / 2);

    nodeUpdate.select("text")
        .style("fill-opacity", 1);

    var nodeExit = node.exit().transition()
        .duration(self.duration)
        .attr("transform", function(d) {
            return "translate(" + source.y + "," + source.x + ")";
        })
        .remove();

    nodeExit.select("rect")
        .attr("height", 1e-6);

    nodeExit.select("text")
        .style("fill-opacity", 1e-6);

    var link = self.svg.selectAll('path.link')
        .data(links, function(d) {
            return d.target.id;
        });

    link.enter().insert('path', 'g')
        .attr('class', function(d) {
            return d.target.overcode? 'link overcode': 'link code';
        })
        .attr('d', function(d) {
            var o = {
                x: source.x0,
                y: source.y0
            };
            return self.diagonal({
                source: o,
                target: o
            });
        });

    link.transition()
        .duration(self.duration)
        .attr("d", self.diagonal);

    link.exit().transition()
        .duration(self.duration)
        .attr('d', function(d) {
            var o = {
                x: source.x,
                y: source.y
            };
            return self.diagonal({
                source: o,
                target: o
            });
        })
        .remove();

    nodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });
};

// Tree.prototype.tooltip_html = tooltip_html;
Tree.prototype.show_verbatims = show_verbatims;
Tree.prototype.helpers_init = helpers_init;
