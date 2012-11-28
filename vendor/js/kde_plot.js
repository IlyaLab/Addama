//Kian Vesteinson, Dick Kreisberg 2012

/** @constructor */
function kde_plot(){
    var data = [],
        kde,
        kde_estimate = [];
    margin = {top:25, bottom:25, left:50, right: 10};
    height = 300,
        width = 800,
        plotHeight = plotWidth = 0,
        numArrays = 1,
        category_label = '',
        xaxis_label = yaxis_label = '',
        plotPadding = 20,
        dataColor = "#00A";

    setDimensions();

    var xScale = d3.scale.linear()
            .domain([d3.max(kde_estimate, function(a){return a[1];}), 0])
            .rangeRound([0,(plotWidth-(numArrays*plotPadding))/numArrays]),
        median = science.stats.median(data),
        yScale = d3.scale.linear()
            .domain([d3.min(kde_estimate, function(a){return a[0];})
            ,d3.max(kde_estimate, function(a){return a[0];})])
            .range([0,plotHeight]),
        xAxis = d3.svg.axis()
            .scale(xScale)
            .orient("top")
            .ticks(2),
        yAxis = d3.svg.axis()
            .scale(yScale)
            .orient("left")
            .ticks(4)
            .tickSize(-plotWidth,0,0);

    var renderColor = "orange",
        renderMedian = true,
        renderPoints = false,
        renderCounts = true,
        multipleArrays = false;

    /**
     @param {data} x - Pass in either an array of data or an array of arrays of data.
     */
    kp.data = function(x){
        if (!arguments.length) return data;
        numArrays = x.length;
        if (x[0] instanceof Array){
            var kdeArray = new Array(numArrays),
                kdeEstimates = new Array(numArrays),
                medianArray = new Array(numArrays),
                min = new Array(numArrays),
                max = new Array(numArrays), maxY = new Array(numArrays);
            if (category_label.length != numArrays) { category_label = (numArrays === 1 ? '' : new Array(numArrays));}
            for (var i = 0; i < numArrays; i++){
                kdeArray[i] = createKDE(x[i]);
                kdeEstimates[i] = sampleEstimates(kdeArray[i]);
                min[i] = (d3.min(kdeEstimates[i],function(a){return a[0];}));
                max[i] = (d3.max(kdeEstimates[i],function(a){return a[0];}));
                maxY[i] = (d3.max(kdeEstimates[i],function(a){return a[1];}));
                medianArray[i] = (science.stats.median(x[i]));
            }
            data = x;
            kde = kdeArray;
            kde_estimate = kdeEstimates;
            median = medianArray;
            multipleArrays = true;
            xScale.domain([d3.max(maxY), 0	]).rangeRound([0, (plotWidth-(numArrays)*plotPadding)/numArrays]);
            yScale.domain([d3.min(min),d3.max(max)]);

        }
        else {
            data = x;
            kde = createKDE(data);
            kde_estimate = sampleEstimates(kde);
            median = science.stats.median(data);
            xScale.domain([d3.max(data,function(a){return a[1];}), 0]);
            yScale.domain([d3.min(data,function(a){return a[0];}),d3.max(data,function(a){return a[0];})]);
        }
        xAxis.scale(xScale)
            .orient("top")
            .ticks(2)
            .tickSize(6,3,0),

            yAxis.scale(yScale)
                .orient("left")
                .ticks(4)
                .tickSize(-plotWidth,0,0);

        return this;
    }

    /**
     Sets the horizontal scale of the plot. Returns the current scale if no value is passed in.
     */
    kp.xScale = function(x){
        if (!arguments.length) return xScale;
        if (x instanceof d3.scale.linear()){
            xScale = x;
            return this;
        }
        console.error("The object passed in is not a scale.")
    }

    /**
     Sets the vertical scale of the plot. Returns the current scale if no value is passed in.
     */
    kp.yScale = function(x){
        if (!arguments.length) return yScale;
        if (x instanceof d3.scale.linear()){
            yScale = x;
            return this;
        }
        console.error("The object passed in is not a scale.")
    }

    /**
     Sets whether or not the median is rendered. Returns the current setting if no value is passed in.
     */
    kp.renderMedian = function(x){
        if (!arguments.length) return renderMedian;
        renderMedian = x;
        return this;
    }

    /**
     Sets whether or not the original data points are rendered. Returns the current setting if no value is passed in.
     */
    kp.renderPoints = function(x){
        if (!arguments.length) return renderPoints;
        renderPoints = x;
        return this;
    }

    /**
     Sets whether or not the number of data points are rendered. Returns the current setting if no value is passed in.
     */
    kp.renderCounts = function(x){
        if (!arguments.length) return renderCounts;
        renderCounts = x;
        return this;
    }

    /**
     Sets the color that the plot(s) are rendered in. Returns the color if no value is passed in.
     */
    kp.renderColor = function(x){
        if (!arguments.length) return renderColor;
        renderColor = x;
        return this;
    }

    /**
     Sets the margin of the object that the plot(s) are rendered in. Returns the margin object if no value is passed in.
     example: {top:25, bottom:25, left:30, right: 10}
     */
    kp.margin = function(x){
        if (!arguments.length) return margin;
        margin = x;
        setDimensions();
        return this;
    }


    kp.dataColor = function(x){
        if (!arguments.length) return dataColor;
        dataColor = x;
        return this;
    };

    /**
     Sets the height of the object that the plot(s) are rendered in. Returns the height if no value is passed in.
     */
    kp.height = function(x){
        if (!arguments.length) return height;
        height = x;
        setDimensions();
        return this;
    }

    /**
     Sets the width of the object that the plot(s) are rendered in. Returns the width if no value is passed in.
     */
    kp.width = function(x){
        if (!arguments.length) return width;
        width = x;
        setDimensions();
        return this;
    };

    /**
     Sets the width of the object that the plot(s) are rendered in. Returns the width if no value is passed in.
     */

    kp.categoryLabels = function(x){
        if (!arguments.length) return category_label;
        category_label = x;
        return this;
    };

    kp.xAxisLabel = function(x){
        if (!arguments.length) return xaxis_label;
        xaxis_label = x;
        return this;
    };

    kp.yAxisLabel = function(x){
        if (!arguments.length) return yaxis_label;
        yaxis_label = x;
        return this;
    };

    /**
     Renders the violin plot in the passed in container. If no container is passed in, the plot is rendered in the body.
     @param {HTML Object} x - The container in which the plot is rendered.
     */
    function kp(selector){
        var root = d3.select("body");
        if (arguments.length) root = d3.select(selector);
        var translateFactor = xScale.range()[1];
        //Creates the frame within which the objects are rendered
        var frame = root.append("svg")
            .attr("class",'kde_plot')
            .attr("height",height)
            .attr("width",width)
            .append('g')
            .attr('transform','translate(' + margin.left + ',' + margin.top + ')')
            .attr("height",plotHeight)
            .attr("width",plotWidth);
        frame.append("g")
            .attr("class","grid")
            .style("fill","none")
            .style("stroke","#111")
            .call(yAxis);
        frame.append("svg:text")
            .attr("transform",'translate(0,-'+margin.top/2+')')
            .attr("dx", -3) // padding-right
            .attr("text-anchor","end")
            .attr("text-align","right")
            .text("Density");
        if (renderCounts){
            frame.append("svg:text")
                .attr("transform",'translate(0,'+(plotHeight+ margin.bottom/2) + ')')
                .attr("dx", -3) // padding-right
                .attr("dy",".35em")
                .attr("text-anchor","start")
                .attr("text-align","left")
                .text("Counts:");
        }

        //If height and width modifiers are defined, scales object by those modifiers
        for (var i = 0; i < numArrays; i++){
            var kde_function = kde;
            var plotKDE = kde_estimate;
            var plotData = data;
            var plotMedian = median;
            var plotLabel = '';
            var dataKDE;
            if (multipleArrays){
                kde_function = kde[i];
                plotData = data[i];
                plotKDE = kde_estimate[i];
                plotMedian = median[i];
                plotLabel = category_label[i] || '';
                dataKDE = kde[i](data[i]);
            } else {
                dataKDE = kde(data);
            }
            var plot = frame.append("g")
                .attr("transform","translate(" + ((plotPadding + translateFactor) * i) + ",0)");
            var g2 = plot.append("g")
                .data([plotKDE]);

            if(plotKDE.length >= 4) {
                g2.append("path")
                    //Draws the second half of the violin plot
                    .attr("class","path")
                    .attr("class","plot_line")
                    .attr("d", d3.svg.line()
                    .x(function(point) {return xScale(point[1]);})
                    .y(function(point) {return yScale(point[0]);})
                    .interpolate("basis"))
                    .style("fill","none")
                    .style("stroke","black");
                g2.append("path")
                    .attr("class","plot_area")
                    .attr("d", d3.svg.area()
                    .interpolate("basis")
                    .y(function(point) {return yScale(point[0]);})
                    .x0(xScale(0))
                    .x1(function(point) { return xScale(point[1]);})

                )
                    .style("fill",renderColor)
                    .style("stroke","none");
            }

            if (renderMedian){
                g2.append("line")
                    .attr('class','median_line')
                    .attr("y1",yScale(plotMedian))
                    .attr("y2",yScale(plotMedian))
                    .attr("x1",0)
                    .attr("x2",translateFactor)
                    .style("stroke","red")
                    .style('stroke-width',"3");
            }

            if (renderPoints){
                g2.append("g")
                    .selectAll(".circle")
                    .data(plotData)
                    .enter().append("circle")
                    .attr("class", "data_point")
                    .attr("cx", function(point,index) {return xScale(Math.random() * dataKDE[index][1]); })
                    .attr("cy", function(point) {return yScale(point);})
                    .attr("r", 2)
                    .style("stroke", "none")
                    .style('fill-opacity',0.7)
                    .style('fill',dataColor);
            }

            if (renderCounts){
                g2.append("svg:text")
                    .attr("class","count_label")
                    .attr("transform",'translate('+translateFactor/2+','+(plotHeight+ margin.bottom/2) + ')')
                    .attr("dx", -3) // padding-right
                    .attr("dy", ".35em") // vertical-align: middle
                    .attr("text-anchor", "middle")
                    .attr("text-align", "left")
                    .text(plotData.length+'');
            }
            g2.append("svg:text")
                .attr("class","category_label")
                .attr("transform",'translate('+translateFactor/2+','+plotHeight +')')
                .attr("dx", -3) // padding-right
                .attr("dy", ".35em") // vertical-align: middle
                .attr("text-anchor", "middle")
                .attr("text-align", "left")
                .text(plotLabel);
            plot.append("g")
                .style("fill","none")
                .style("stroke","black")
                .call(xAxis);
        }
        //x axis label
        frame.append("svg:text")
            .attr("class","axis_label")
            .attr("transform",'translate('+plotWidth/2+','+(plotHeight+margin.bottom)+')')
            .attr("dx", -3) // padding-right
            .attr("text-anchor", "middle")
            .attr("text-align", "left")
            .text(xaxis_label);
        //y axis label
        frame.append("svg:text")
            .attr("class","axis_label")
            .attr("transform",'translate('+(plotWidth+margin.right)+','+(plotHeight/2)+'),rotate(-90)')
            .attr("dx", -3) // padding-right
            .attr("text-anchor", "middle")
            .attr("text-align", "left")
            .text(yaxis_label);
    }

    /**
     @param {Array of numbers} points - The set of data to be made into a KDE
     @returns {Array of points} The KDE
     */
    function createKDE(points){
        var kde = science.stats.kde().sample(points).kernel(science.stats.kernel.gaussian);
        return kde;
    }

    function sampleEstimates(kde){
        var newPoints = [];
        var data= kde.sample();
        if (data === undefined) { return [];}
        if (data.length < 4) {
            data.forEach(function(point) { point = [point,0];});
            return data;
        }

        var variance = science.stats.variance(data);
        var extent = d3.extent(data);
        var dataSize = extent[1] - extent[0];
        if (variance > dataSize){ variance = dataSize;}
        var stepSize = variance / 100;
        //Filters the data down to relevant points
        //20 points over two variances
        newPoints = d3.range(d3.min(data)-stepSize,d3.max(data)+stepSize,stepSize);
        return kde(newPoints);
    }

    function setDimensions() {
        plotHeight = height - margin.top - margin.bottom;
        plotWidth = width - margin.left - margin.right;
    }

    return kp;
}

// Copyright (c) 2011, Jason Davies
// All rights reserved.

// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:

//   * Redistributions of source code must retain the above copyright notice, this
//     list of conditions and the following disclaimer.

//   * Redistributions in binary form must reproduce the above copyright notice,
//     this list of conditions and the following disclaimer in the documentation
//     and/or other materials provided with the distribution.

//   * The name Jason Davies may not be used to endorse or promote products
//     derived from this software without specific prior written permission.

// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL JASON DAVIES BE LIABLE FOR ANY DIRECT, INDIRECT,
// INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
// PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
// LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
// OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
// ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
science = {version: "1.9.1"}; // semver
science.ascending = function(a, b) {
    return a - b;
};
// Euler's constant.
science.EULER = .5772156649015329;
// Compute exp(x) - 1 accurately for small x.
science.expm1 = function(x) {
    return (x < 1e-5 && x > -1e-5) ? x + .5 * x * x : Math.exp(x) - 1;
};
science.functor = function(v) {
    return typeof v === "function" ? v : function() { return v; };
};
science.stats = {};
science.stats.iqr = function(x) {
    var quartiles = science.stats.quantiles(x, [.25, .75]);
    return quartiles[1] - quartiles[0];
};
science.stats.mean = function(x) {
    var n = x.length;
    if (n === 0) return NaN;
    var m = 0,
        i = -1;
    while (++i < n) m += (x[i] - m) / (i + 1);
    return m;
};
science.stats.median = function(x) {
    return science.stats.quantiles(x, [.5])[0];
};
science.stats.mode = function(x) {
    x = x.slice().sort(science.ascending);
    var mode,
        n = x.length,
        i = -1,
        l = i,
        last = null,
        max = 0,
        tmp,
        v;
    while (++i < n) {
        if ((v = x[i]) !== last) {
            if ((tmp = i - l) > max) {
                max = tmp;
                mode = last;
            }
            last = v;
            l = i;
        }
    }
    return mode;
};
// Uses R's quantile algorithm type=7.
science.stats.quantiles = function(d, quantiles) {
    d = d.slice().sort(science.ascending);
    var n_1 = d.length - 1;
    return quantiles.map(function(q) {
        if (q === 0) return d[0];
        else if (q === 1) return d[n_1];

        var index = 1 + q * n_1,
            lo = Math.floor(index),
            h = index - lo,
            a = d[lo - 1];

        return h === 0 ? a : a + h * (d[lo] - a);
    });
};
// Unbiased estimate of a sample's variance.
// Also known as the sample variance, where the denominator is n - 1.
science.stats.variance = function(x) {
    var n = x.length;
    if (n < 1) return NaN;
    if (n === 1) return 0;
    var mean = science.stats.mean(x),
        i = -1,
        s = 0;
    while (++i < n) {
        var v = x[i] - mean;
        s += v * v;
    }
    return s / (n - 1);
};

// Bandwidth selectors for Gaussian kernels.
// Based on R's implementations in `stats.bw`.
science.stats.bandwidth = {

    // Silverman, B. W. (1986) Density Estimation. London: Chapman and Hall.
    nrd0: function(x) {
        var hi = Math.sqrt(science.stats.variance(x));
        if (!(lo = Math.min(hi, science.stats.iqr(x) / 1.34)))
            (lo = hi) || (lo = Math.abs(x[1])) || (lo = 1);
        return .9 * lo * Math.pow(x.length, -.2);
    },

    // Scott, D. W. (1992) Multivariate Density Estimation: Theory, Practice, and
    // Visualization. Wiley.
    nrd: function(x) {
        var h = science.stats.iqr(x) / 1.34;
        return 1.06 * Math.min(Math.sqrt(science.stats.variance(x)), h)
            * Math.pow(x.length, -1/5);
    }
};


science.stats.distribution = {
};
// From http://www.colingodsey.com/javascript-gaussian-random-number-generator/
// Uses the Box-Muller Transform.
science.stats.distribution.gaussian = function() {
    var random = Math.random,
        mean = 0,
        sigma = 1,
        variance = 1;

    function gaussian() {
        var x1,
            x2,
            rad,
            y1;

        do {
            x1 = 2 * random() - 1;
            x2 = 2 * random() - 1;
            rad = x1 * x1 + x2 * x2;
        } while (rad >= 1 || rad === 0);

        return mean + sigma * x1 * Math.sqrt(-2 * Math.log(rad) / rad);
    }

    gaussian.pdf = function(x) {
        x = (x - mu) / sigma;
        return science_stats_distribution_gaussianConstant * Math.exp(-.5 * x * x) / sigma;
    };

    gaussian.cdf = function(x) {
        x = (x - mu) / sigma;
        return .5 * (1 + science.stats.erf(x / Math.SQRT2));
    };

    gaussian.mean = function(x) {
        if (!arguments.length) return mean;
        mean = +x;
        return gaussian;
    };

    gaussian.variance = function(x) {
        if (!arguments.length) return variance;
        sigma = Math.sqrt(variance = +x);
        return gaussian;
    };

    gaussian.random = function(x) {
        if (!arguments.length) return random;
        random = x;
        return gaussian;
    };

    return gaussian;
};

science_stats_distribution_gaussianConstant = 1 / Math.sqrt(2 * Math.PI);


// See <http://en.wikipedia.org/wiki/Kernel_(statistics)>.
science.stats.kernel = {
    uniform: function(u) {
        if (u <= 1 && u >= -1) return .5;
        return 0;
    },
    triangular: function(u) {
        if (u <= 1 && u >= -1) return 1 - Math.abs(u);
        return 0;
    },
    epanechnikov: function(u) {
        if (u <= 1 && u >= -1) return .75 * (1 - u * u);
        return 0;
    },
    quartic: function(u) {
        if (u <= 1 && u >= -1) {
            var tmp = 1 - u * u;
            return (15 / 16) * tmp * tmp;
        }
        return 0;
    },
    triweight: function(u) {
        if (u <= 1 && u >= -1) {
            var tmp = 1 - u * u;
            return (35 / 32) * tmp * tmp * tmp;
        }
        return 0;
    },
    gaussian: function(u) {
        return 1 / Math.sqrt(2 * Math.PI) * Math.exp(-.5 * u * u);
    },
    cosine: function(u) {
        if (u <= 1 && u >= -1) return Math.PI / 4 * Math.cos(Math.PI / 2 * u);
        return 0;
    }
};
// http://exploringdata.net/den_trac.htm
science.stats.kde = function() {
    var kernel = science.stats.kernel.gaussian,
        sample = [],
        bandwidth = science.stats.bandwidth.nrd;

    function kde(points, i) {
        var bw = bandwidth.call(this, sample);
        return points.map(function(x) {
            var i = -1,
                y = 0,
                n = sample.length;
            while (++i < n) {
                y += kernel((x - sample[i]) / bw);
            }
            return [x, y / bw / n];
        });
    }

    kde.kernel = function(x) {
        if (!arguments.length) return kernel;
        kernel = x;
        return kde;
    };

    kde.sample = function(x) {
        if (!arguments.length) return sample;
        sample = x;
        return kde;
    };

    kde.bandwidth = function(x) {
        if (!arguments.length) return bandwidth;
        bandwidth = science.functor(x);
        return kde;
    };

    return kde;
};