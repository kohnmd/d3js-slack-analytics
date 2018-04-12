var svg = d3.select("svg"),
    margin = {top: 20, right: 80, bottom: 30, left: 50},
    width = svg.attr("width") - margin.left - margin.right,
    height = svg.attr("height") - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var parseTime = d3.timeParse("%Y-%m-%d");

var x = d3.scaleTime().range([0, width]),
    y = d3.scaleLinear().range([height, 0]),
    z = d3.scaleOrdinal(d3.schemeCategory10);

var line = d3.line()
    .curve(d3.curveLinear)
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.messages); });

d3.csv("data/Choozle Slack User Analytics Apr 11 2018.csv", function(data) {
    var dates = [
        parseTime('2018-04-01'),
        parseTime('2018-03-28'),
        parseTime('2018-04-11'),
        parseTime('2018-04-22')

    ];
    dates.sort(function(a,b) { return a - b; });

    var people = data.slice(0, 10).map(function(row) {
        i = 0;
        return {
            id: row.Name,
            values: dates.map(function(date) {
                i++;
                return {
                    date: date,
                    messages: parseInt(row.chats_sent) + (1000 * i)
                }
            })
        }
    });

    x.domain([
        d3.min(people, function(person) { return d3.min(person.values, function(d) { return d.date; })}),
        d3.max(people, function(person) { return d3.max(person.values, function(d) { return d.date; })})
    ]);
    y.domain([
        d3.min(people, function(person) { return d3.min(person.values, function(d) { return d.messages; })}),
        d3.max(people, function(person) { return d3.max(person.values, function(d) { return d.messages; })})
    ]);

    // Add X-Axis
    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Add X Gridlines
    g.append("g")
        .attr("class", "grid")
        .attr("transform", "translate(0," + height + ")")
        .call(
            d3.axisBottom(x)
                .ticks()
                .tickSize(-height)
                .tickFormat("")
        );

    // Add Y-Axis
    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y))
     .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("fill", "#000")
        .text("Messages Sent");

    // Add Y Gridlines
    g.append("g")
        .attr("class", "grid")
        .call(
            d3.axisLeft(y)
                .ticks()
                .tickSize(-width)
                .tickFormat("")
        );


    // Add Line (per person)
    var person = g.selectAll(".person")
        .data(people)
        .enter().append("g")
        .attr("class", "person");

    person.append("path")
        .attr("class", "line")
        .attr("d", function(d) { return line(d.values); })
        .style("stroke", function(d) { return z(d.id); });

    person.append("text")
        .datum(function(d) { return {id: d.id, value: d.values[d.values.length - 1]}; })
        .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.messages) + ")"; })
        .attr("x", 3)
        .attr("dy", "0.35em")
        .style("font", "10px sans-serif")
        .text(function(d) { return d.id; });

    // Add Scatter (per person)
    var personScatter = g.selectAll(".dots")
        .data(people)
        .enter().append("g")
        .attr("class", "dots");

    personScatter.selectAll(".dot")
        .data(function(d) { return d.values; })
        .enter().append("circle")
        .attr("class", "dot")
        .attr("r", 3.5)
        .attr("cx", function(d) { return x(d.date); })
        .attr("cy", function(d) { return y(d.messages); });
});
