const width = 600;
const height = 500;
const margin = {top: 20, right: 30, bottom: 30, left: 40};

let svg;
let scaleX;
let scaleY;
let xAxisGroup;
let yAxisGroup;

function initHistogram() {
    svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height);

    scaleX = d3.scaleLinear()
        .domain([0.0, 1.0])
        .range([margin.left, width - margin.right]);

    scaleY = d3.scaleLinear()
        .domain([0.0, 1.0])
        .range([height / 2 - margin.bottom, margin.top]);


    svg.append("g")
        .attr("id", "x-axis")
        .attr("transform", `translate(0,${height / 2 - margin.bottom})`)
        .call(d3.axisBottom(scaleX));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(scaleY));

    svg.append("text")
        .attr("id", "label-density")
        .attr("x", width - margin.right)
        .attr("y", height / 2)
        .attr("text-anchor", "end")
        .attr("fill", "currentColor")
        .attr("font-size", "12px")
        .text("density");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -margin.top)
        .attr("y", 12)
        .attr("text-anchor", "end")
        .attr("fill", "currentColor")
        .attr("font-size", "12px")
        .text("intensity");

    d3.select("#tfContainer").append(() => svg.node());
}

function updateHistogram(volume) {
    volume = volume.filter(v => isFinite(v) && v >= 0.0001 && v < 1.0);

    const histogram = d3.bin()
        .domain([d3.min(volume), d3.max(volume)])
        .thresholds(100);

    const bins = histogram(volume);

    const totalCount = volume.length;

    bins.forEach(bin => {
        bin.density = bin.length / totalCount / (bin.x1 - bin.x0);
    });

    const maxDensity = d3.max(bins, d => d.density);
    bins.forEach(bin => {
        bin.normalizedDensity = bin.density / maxDensity;
    });

    const x = d3.scaleLinear()
        .domain([d3.min(volume), d3.max(volume)])
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLog()
        .domain([0.0001, 1]) // normalized y
        .range([height / 2 - margin.bottom, margin.top]);

    // Update axes
    let transition = d3.transition().duration(800);

    // Add a rect for each bar.
    svg.selectAll('rect')
        .data(bins)
        .join('rect')
        .attr("fill", "#444")
        .attr("x", (b) => x(b.x0))
        .attr("y", y(y.domain()[0]))
        .transition(transition)
        .attr("width", (b) => d3.max([0, x(b.x1) - x(b.x0)]) - 2)
        .attr("height", d => y(0.0001) - y(Math.max(d.normalizedDensity, 0.0001)));

    svg.select("#x-axis").raise();
    svg.select("#label-density").raise();
}