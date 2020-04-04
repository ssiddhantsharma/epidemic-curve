var sim_params = new Object();
sim_params.beta = 2.3E-3;
sim_params.gamma = 0.02;
sim_params.v = 0;
sim_params.mu = 0.5;
sim_params.m = 1000
sim_params.N = 3E8;
sim_params.y0 = 10000;

var selectCountryValue = "World";

var display_params = new Object();
display_params.logy = 7;
display_params.startx = 20;
display_params.offsetx = 0;

var result_params = new Object();
result_params.logcapacity = 6;
result_params.treatrate = 0.002;
result_params.untreatrate = 0.02;

var descriptions = new Object();
descriptions.beta = "Infectivity";
descriptions.gamma = "Recovery rate";
descriptions.v = "Vaccination rate";
descriptions.N = "Population";
descriptions.y0 = "Initial Infections";
descriptions.logy = "Y Scale (log)";
descriptions.startx = "X Offset";
descriptions.logcapacity = "Hosp. Capacity (log)";
descriptions.treatrate = "Mortality (treated)";
descriptions.untreatrate = "Mortality (untreated)";

// sim computational params
var dt = 0.01;
var T = 500000;
var num_points = 200;
var data_frequency = T / num_points;
var start_date = new Date(2020, 0, 1);
var end_date = new Date(2020, 0, 1+num_points);

function nFormatter(num) {
  if (num < 1E3) {
    return num.toFixed(0);
  }
  var si = [
    { value: 1, symbol: "" },
    { value: 1E3, symbol: "K" },
    { value: 1E6, symbol: "M" },
    { value: 1E9, symbol: "B" },
  ];
  var rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  var i;
  for (i = si.length - 1; i > 0; i--) {
    if (num >= si[i].value) {
      break;
    }
  }
  return (num / si[i].value).toFixed(1).replace(rx, "$1") + si[i].symbol;
}

function sim_curve() {
  var beta = sim_params.beta / sim_params.N
  var gamma = sim_params.gamma
  var beta_external = 0.01 * beta;
  var m = sim_params.m;
  var rho = gamma / beta;
  var v = sim_params.v;
  var mu = sim_params.mu;
  var N = sim_params.N;
  var y0 = sim_params.y0;
  var capacity = Math.pow(10, result_params.logcapacity);

  var w = 0;
  var x = N-y0;
  var y = y0;
  var z = 0;
  var dw, dx, dy, dz;

  var ws = [];
  var xs = [];
  var ys = [];
  var zs = [];
  var cs = [];
  // var data = [];

  var day = 0;
  var total_deaths = 0;
  var total_cases = 0;

  start_date = new Date(2020, 0, 1 + display_params.startx);
  for (t = 0; t < T; t++) {
      dx = -beta * x * y - beta_external * (m-1) * x * y - v * x;
      dw = beta * x * y + beta_external * (m-1) * x * y - mu * w;
      dy = mu * w - gamma * y;
      dz = gamma * y + v * x;

      new_cases = mu * w;

      w += dw * dt;
      x += dx * dt;
      y += dy * dt;
      z += dz * dt;

      total_cases += new_cases * dt;
      if (y < capacity) {
        total_deaths += new_cases * result_params.treatrate * dt;
      }
      else {
        // total_deaths += capacity * result_params.treatrate * dt;
        total_deaths += new_cases * result_params.untreatrate * dt;
      }

      if (t % data_frequency == 0) {
        var date = new Date(2020, 0, 1 + day + display_params.startx);
        ws.push({date: date, measurement: w});
        xs.push({date: date, measurement: x});
        ys.push({date: date, measurement: y});
        zs.push({date: date, measurement: z});
        cs.push({date: date, measurement: capacity});
        // data.push(y)
        day += 1;
      }
  }
  end_date = new Date(2020, 0, 1 + day + display_params.startx);

  var sim_data = new Object();
  sim_data.curves = [
    // {id: "waiting", values: ws},
    {id: "infected", values: ys},
    {id: "capacity", values: cs},
    // {id: "healthy", values: xs},
    // {id: "removed", values: zs},
  ];
  L = zs.length

  sim_data.total_num_cases = total_cases; // zs[L-1].measurement;
  sim_data.total_deaths = total_deaths;
  return sim_data;
}

const line = d3.line()
    .x(function(d) { return xScale(d.date); })
    .y(function(d) { return yScale(d.measurement); });

function update_plot2(data) {
  d3.select("path.line-2").remove()

  // update_axis(data)
  let id = 0;
  const ids = function () {
      return "line-2";
  }

  //----------------------------LINES-----------------------------//
  const lines = svg.selectAll("lines")
      .data(data.curves)
      .enter()
      .append("g");

  lines.append("path")
  .attr("class", ids)
  .attr("d", function(d) { return line(d.values); });
}

function update_plot(data) {
  d3.select("path.line-0").remove()
  d3.select("path.line-1").remove()

  // update_axis(data)
  let id = 0;
  const ids = function () {
      return "line-"+id++;
  }

  //----------------------------LINES-----------------------------//
  const lines = svg.selectAll("lines")
      .data(data.curves)
      .enter()
      .append("g");

  lines.append("path")
  .attr("class", ids)
  .attr("d", function(d) { return line(d.values); });

  // lines.append("text")
  // .attr("class","serie_label")
  // .datum(function(d) {
  //     return {
  //         id: d.id,
  //         value: d.values[d.values.length - 1]}; })
  // .attr("transform", function(d) {
  //         return "translate(" + (xScale(d.value.date) + 10)
  //         + "," + (yScale(d.value.measurement) + 5 )+ ")"; })
  // .attr("x", 5)
  // .text(function(d) { return ("Serie ") + d.id; });

  //---------------------------POINTS-----------------------------//
  // lines.selectAll("points")
  // .data(function(d) {return d.values})
  // .enter()
  // .append("circle")
  // .attr("cx", function(d) { return xScale(d.date); })
  // .attr("cy", function(d) { return yScale(d.measurement); })
  // .attr("r", 1)
  // .attr("class","point")
  // .style("opacity", 1);

  //---------------------------EVENTS-----------------------------//

  // lines.selectAll("circles")
  // .data(function(d) { return(d.values); } )
  // .enter()
  // .append("circle")
  // .attr("cx", function(d) { return xScale(d.date); })
  // .attr("cy", function(d) { return yScale(d.measurement); })
  // .attr('r', 10)
  // .style("opacity", 0)
  // .on('mouseover', function(d) {
  //     tooltip.transition()
  // .delay(30)
  //     .duration(200)
  //     .style("opacity", 1);
  //     tooltip.html(d.measurement)
  //     .style("left", (d3.event.pageX + 25) + "px")
  //     .style("top", (d3.event.pageY) + "px");
  //     const selection = d3.select(this).raise();
  //     selection
  //     .transition()
  //     .delay("20")
  //     .duration("200")
  //     .attr("r", 6)
  //     .style("opacity", 1)
  //     .style("fill","#ed3700");
  // })
  // .on("mouseout", function(d) {
  //     tooltip.transition()
  //     .duration(100)
  //     .style("opacity", 0);
  //     const selection = d3.select(this);
  //     selection
  //     .transition()
  //     .delay("20")
  //     .duration("200")
  //     .attr("r", 10)
  //     .style("opacity", 0);
  // });
}

//------------------------1. PREPARATION------------------------//
//-----------------------------SVG------------------------------//
const width = 800;
const height = 500;
const margin = 5;
const padding = 20;
const adj = 50;
// we are appending SVG first
const container = d3.select("div#container")

function make_new_sim_param_slider(sim_param_name, min, max, step) {
  function update() {
    sim_params[sim_param_name] = Number(document.getElementById(sim_param_name).value);
    sim_data = sim_curve();
    update_plot(sim_data);
    update_text(sim_data)
  }

  const siminput_container = d3.select(".siminputs")
  slider_input = siminput_container.append("div")
    .attr("class", "inputdiv");
  // slider_input.append("div").text(min);
  slider_input.append("div")
    .text(descriptions[sim_param_name]);
  // slider_input.append("div")
    // .text(sim_param_name);
  slider_input.append("div")
    .text(min + " <-----> " + max);
  // slider_input.append("div").text(min).attr("style", "width:150px; margin:0px");
  slider_input.append("input")
    .attr("type", "range")
    .attr("min", min)
    .attr("max", max)
    .attr("step", step)
    .attr("id", sim_param_name)
    .attr("value", sim_params[sim_param_name])
    .on("input", function input() {
      update();
    });
  // slider_input.append("div").text(max).attr("style", "width:150px");
}

function make_new_sim_param_input(sim_param_name) {
  function update() {
    sim_params[sim_param_name] = Number(document.getElementById(sim_param_name).value);
    sim_data = sim_curve();
    update_plot(sim_data);
    update_text(sim_data)
  }

  const siminput_container = d3.select(".siminputs")
  slider_input = siminput_container.append("div")
    .attr("class", "inputdiv");
  slider_input.append("div")
    .text(descriptions[sim_param_name]);
  // slider_input.append("div").text(min);
  // slider_input.append("div")
  //   .text(sim_param_name);
  // slider_input.append("div").text(min).attr("style", "width:150px; margin:0px");
  slider_input.append("input")
    .attr("type", "number")
    .attr("id", sim_param_name)
    .attr("value", sim_params[sim_param_name])
    .on("input", function input() {
      update();
    });
  // slider_input.append("div").text(max).attr("style", "width:150px");
}

make_new_sim_param_slider("beta", 1.5E-3, 2.5E-3, 5E-5, )
make_new_sim_param_slider("gamma", 0.01, 0.03, 0.001)
// make_new_sim_param_slider("mu", 0.0, 1.0, 0.1)
make_new_sim_param_slider("v", 0.0, 1e-4, 1e-5)
make_new_sim_param_input("N")
make_new_sim_param_input("y0")
// make_new_slider("m", 0, 100, 10)

function make_new_display_param_slider(display_param_name, min, max, step) {
  function update() {
    display_params[display_param_name] = Number(document.getElementById(display_param_name).value);
    sim_data = sim_curve();
    update_axis(sim_data);
    update_plot(sim_data);
    update_text(sim_data)
  }

  const displayinput_container = d3.select(".displayinputs")
  slider_input = displayinput_container.append("div")
    .attr("class", "inputdiv");
  // slider_input.append("div").text(min);
  slider_input.append("div")
    .text(descriptions[display_param_name]);
  slider_input.append("div")
    .text(min + " <-----> " + max);
  // slider_input.append("div").text(min).attr("style", "width:150px; margin:0px");
  slider_input.append("input")
    .attr("type", "range")
    .attr("min", min)
    .attr("max", max)
    .attr("step", step)
    .attr("id", display_param_name)
    .attr("value", display_params[display_param_name])
    .on("input", function input() {
      update();
    });
  // slider_input.append("div").text(max).attr("style", "width:150px");
}
make_new_display_param_slider("logy", 2, 9, 0.5);
make_new_display_param_slider("startx", 0, 200, 20);
// make_new_display_param_slider("offsetx", 0, 300, 30);

function make_new_result_param_slider(result_param_name, min, max, step) {
  function update() {
    result_params[result_param_name] = Number(document.getElementById(result_param_name).value);
    sim_data = sim_curve();
    update_axis(sim_data);
    update_plot(sim_data);
    update_text(sim_data)
  }

  const resultinput_container = d3.select(".resultinputs")
  slider_input = resultinput_container.append("div")
    .attr("class", "inputdiv");
  // slider_input.append("div").text(min);
  slider_input.append("div")
    .text(descriptions[result_param_name]);
  slider_input.append("div")
    .text(min + " <-----> " + max);
  // slider_input.append("div").text(min).attr("style", "width:150px; margin:0px");
  slider_input.append("input")
    .attr("type", "range")
    .attr("min", min)
    .attr("max", max)
    .attr("step", step)
    .attr("id", result_param_name)
    .attr("value", result_params[result_param_name])
    .on("input", function input() {
      update();
    });
  // slider_input.append("div").text(max).attr("style", "width:150px");
}
make_new_result_param_slider("logcapacity", 1, 7, 0.5);
make_new_result_param_slider("treatrate", 0, 0.02, 0.002);
make_new_result_param_slider("untreatrate", 0, 0.05, 0.005);

const svg = container.append("svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "-"
          + adj + " -"
          + adj + " "
          + (width + adj *3) + " "
          + (height + adj*3))
    .style("padding", padding)
    .style("margin", margin)
    .classed("svg-content", true);

sim_data = sim_curve();

const timeConv = d3.timeParse("%d-%b-%Y");

//----------------------------SCALES----------------------------//
var xScale;
var yScale;
var yaxis;
var xaxis;

function update_axis(sim_data) {
  xScale = d3.scaleTime().range([0,width]);
  yScale = d3.scaleLinear().rangeRound([height, 0]);
  dates = [start_date, end_date]
  xScale.domain(dates);
  yScale.domain([0, Math.pow(10, display_params.logy)]);

  //-----------------------------AXES-----------------------------//
  yaxis = d3.axisLeft()
      .ticks(10) // (slices[0].values).length)
      .tickFormat(nFormatter)
      .scale(yScale);

  xaxis = d3.axisBottom()
      .ticks(10)
      .tickFormat(d3.timeFormat('%b %d'))
      .scale(xScale);

  svg.select(".xaxis")
      .transition(t)
      .call(xaxis)

  svg.select(".yaxis")
      .transition(t)
      .call(yaxis)

  if (real_data && real_data.curves) {
    update_plot2(real_data);
  }
}

//---------------------------TOOLTIP----------------------------//
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute");

//-------------------------2. DRAWING---------------------------//
//-----------------------------AXES-----------------------------//

update_axis(sim_data)

svg.append("g")
    .attr("class", "xaxis")
    .attr("transform", "translate(0," + height + ")")
    .call(xaxis);

svg.append("g")
    .attr("class", "yaxis")
    .call(yaxis)
    // .append("text")
    // .attr("transform", "rotate(-90)")
    // .attr("dy", ".75em")
    // .attr("y", 6)
    // .style("text-anchor", "end")
    // .text("Frequency");

svg.append("text")
  .attr("class", "text-cases")
  .attr("x", 700)
  .attr("y", 20)
  .text(" cases")

svg.append("text")
  .attr("class", "text-deaths")
  .attr("x", 700)
  .attr("y", 40)
  .text(" deaths")

function update_text(sim_data) {
  cases = nFormatter(sim_data.total_num_cases);
  deaths = nFormatter(sim_data.total_deaths);
  case_percent = (sim_data.total_num_cases / sim_params.N * 100).toFixed(1)
  death_percent = (sim_data.total_deaths / sim_params.N * 100).toFixed(1)
  d3.select(".text-cases")
    .text(cases + " cases (" + case_percent + "%)");
  d3.select(".text-deaths")
    .text(deaths + " deaths (" + death_percent + "%)");
}

update_text(sim_data)

update_plot(sim_data)

var real_data = new Object();
real_data.countries = new Object();
real_data.curves = [];
// L = real_data.countries.date.length
function load_csv() {
  real_data.countries = d3.csv("data/total_cases.csv").then(function(data) {
    keys = Object.keys(data[0]);
    for (const key of keys) {
      if (key != "date") {
        values = []
        for (var i = 0; i < data.length; i++) {
          v = data[i][key];
          if (v != "") {
            values.push({
              date: new Date(data[i].date),
              measurement: Number(v)
            });
          }
        }
        d = {id: key, values: values};
        real_data.countries[key] = d;
      }
    }

    const resultinput_container = d3.select(".resultinputs")
    slider_input = resultinput_container.append("div")
      .attr("class", "inputdiv");
    slider_input.append("div")
      .text("Country Data");
    countries = Object.keys(real_data.countries)
    var select = slider_input.append('select')
        .attr('class', 'select')
        // .attr('multiple', 'select')
        .attr('value', selectCountryValue)
        .on('change', onchange)

    var options = select
      .selectAll('option')
      .data(countries).enter()
      .append('option')
        .text(function (d) { return d; });

    real_data.curves = [real_data.countries.World];
    update_plot2(real_data);

    function onchange() {
      selectCountryValue = []
      selectCountryValue = d3.select('select').property('value')
      // d3.select('select') // .property('value')
      //   .selectAll("option:checked").each(function(value) {
      //     selectCountryValue.push(value)
      //   });
      // not dealing with multiple selections atm
      if (selectCountryValue) {
        // selectCountryValue = selectCountryValue[0]
        country_data = real_data.countries[selectCountryValue];
        L = country_data.values.length;
        max_value = Number(country_data.values[L-1].measurement);
        display_params.logy = Math.log(max_value) / Math.log(10);
        real_data.curves = [country_data];
        update_axis(real_data);
        update_plot(sim_data);
        update_plot2(real_data);
      };
    };
  });
  // , function(data) {
  //   entries = Object.entries(data);
  //   for (const [key, value] of entries) {
  //     if (key in real_data.countries) {
  //       real_data.countries[key].push(value);
  //     }
  //     else {
  //       real_data.countries[key] = [value];
  //     }
  //   };
  // });
}
// for (var i = 0; i <

load_csv()
// console.log(real_data)
