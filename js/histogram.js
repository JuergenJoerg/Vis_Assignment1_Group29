class Histogram {
    constructor(containerSelector, width = 600, height = 500, margin = {top: 20, right: 30, bottom: 30, left: 40}) {
        this.width = width;
        this.height = height;
        this.margin = margin;

        this.svg = d3.create("svg")
            .attr("width", this.width)
            .attr("height", this.height);

        this.scaleX = d3.scaleLinear()
            .domain([0.0, 1.0])
            .range([this.margin.left, this.width - this.margin.right]);

        this.scaleY = d3.scaleLinear()
            .domain([0.0, 1.0])
            .range([this.height / 2 - this.margin.bottom, this.margin.top]);

        this.svg.append("g")
            .attr("id", "x-axis")
            .attr("transform", `translate(0,${this.height / 2 - this.margin.bottom})`)
            .call(d3.axisBottom(this.scaleX));

        this.svg.append("g")
            .attr("transform", `translate(${this.margin.left},0)`)
            .call(d3.axisLeft(this.scaleY));

        this.svg.append("text")
            .attr("id", "label-density")
            .attr("x", this.width - this.margin.right)
            .attr("y", this.height / 2)
            .attr("text-anchor", "end")
            .attr("fill", "currentColor")
            .attr("font-size", "12px")
            .text("density");

        this.svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -this.margin.top)
            .attr("y", 12)
            .attr("text-anchor", "end")
            .attr("fill", "currentColor")
            .attr("font-size", "12px")
            .text("intensity");

        d3.select(containerSelector).append(() => this.svg.node());
    }

    update(volume) {
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
            .range([this.margin.left, this.width - this.margin.right]);

        const y = d3.scaleLog()
            .domain([0.0001, 1])
            .range([this.height / 2 - this.margin.bottom, this.margin.top]);

        const transition = d3.transition().duration(800);

        this.svg.selectAll('rect')
            .data(bins)
            .join('rect')
            .attr("fill", "#444")
            .attr("x", (b) => x(b.x0))
            .attr("y", y(y.domain()[0]))
            .transition(transition)
            .attr("width", (b) => Math.max(0, x(b.x1) - x(b.x0)) - 2)
            .attr("height", d => y(0.0001) - y(Math.max(d.normalizedDensity, 0.0001)));

        this.svg.select("#x-axis").raise();
        this.svg.select("#label-density").raise();
    }
}
