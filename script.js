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

var dates = [
    '2017-12-08',
    '2018-01-15',
    '2018-01-23',
    '2018-01-29',
    '2018-02-05',
    '2018-02-12',
    '2018-02-21',
    '2018-02-26',
    '2018-03-12',
    '2018-03-19',
    '2018-03-26',
    '2018-04-09'

];

var queue = d3.queue();
for (var i = 0; i < dates.length; i++) {
    queue.defer(d3.csv, "/data/" + dates[i] + ".csv");
}
queue.await(letsDoThis);

function letsDoThis(error) {
    if(error) {
        console.log(error);
        return;
    }

    var people = [];

    // Loop through all dates
    for (var i = 1; i < arguments.length; i++) {
        var date = parseTime(dates[i-1]);
        var fileData = arguments[i];
        fileData.forEach(function(person) {
            var found = _.findKey(people, ['id', person.Name]);
            var messages = parseInt(person.chats_sent);
            var data = {
                date: date,
                messages: messages
            };

            if (typeof found != 'undefined') {
                // Add new data to person's values
                people[found].values.push(data);
                if (people[found].max < messages) {
                    people[found].max = messages;
                }
            } else {
                // Add person to people
                people.push({
                    id: person.Name,
                    max: messages,
                    values: [data]
                });
            }
        });
    }

    // Sort people by messages sent
    people = _.orderBy(people, [function(o) { return o.max; }], ['desc']);
    people = people.slice(0, 10);


    // Sort each person's values by date.
    // TODO Can this be done earlier? Obsolete if dates are in order before itterating through them.
    people.forEach(function(person) {
        delete person.max;
        person.values = _.sortBy(person.values, 'date');
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
        .attr("transform", function(d) { return "translate(" + (x(d.value.date) + 5) + "," + y(d.value.messages) + ")"; })
        .attr("x", 3)
        .attr("dy", "0.35em")
        .style("font", "10px sans-serif")
        .attr("fill", function(d) {

            // console.log(d.id);
            // console.log(z(d.id));

            return z(d.id);
        })
        .text(function(d) { return d.id; });

    // Add Scatter (per person)
    person.selectAll(".person")
        .data(function(d) {
            var values = d.values;
            d.values.forEach(function(o) {
                o.id = d.id;
            });
            return values;
        })
        .enter().append("circle")
        .attr("class", "dot")
        .style("fill", function(d) { return z(d.id); })
        .attr("r", 3.5)
        .attr("cx", function(d) { return x(d.date); })
        .attr("cy", function(d) { return y(d.messages); });
}