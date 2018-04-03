//	
//		TRRA Dashboard
//		by Maxwell Garber <max.garber+dev@gmail.com>
//		graph.js
//


//	Global Variables
var abscissa = { observed: [], forecast: [] };
var moments = { observed: [], forecast: [] };
var ordinates = {
	observed: { flow: [], flood: [], temp: [] },
	forecast: { flow: [], flood: [], temp: [] }
};
var units = { flow: 'kcfs', flood: 'ft', temp: '˚C' };
var xAxis = {};
var yAxis_flow = {};
var yAxis_flood = {};
var yAxis_temp = {};
var graphScale = {};
var flowDataset = {};
var floodDataset = {};
var tempDataset = {};
var graphData = {};
var graphScale = {};
var graphOptions = {};
var graphCanvas = null;
var graphSettings = {};
var theGraph;

let plotColors = {
	flow: '#0088ff',
	flood: '#00ff00',
	temperature: '#ff0000'
};

let selectors = {
	graphCanvas: '#graphCanvas',
	currentFlow: '#flow',
	currentFlood: '#flood',
	currentTemp: '#temp'
};

let flowAndFloodSourceURI = "https://water.weather.gov/ahps2/hydrograph_to_xml.php?gage=shrp1&output=xml";
let temperatureSourceURI = "https://waterservices.usgs.gov/nwis/iv/";
let flowAndFloodParameters = {
	gage: 'shrp1',
	output: 'xml'
};

let temperatureParameters = {
	format: 'waterml,2.0',
	sites: '03049640',
	startDT: '',		// literal example '2017-04-12T15:00-0000'	@NOTE these get overwritten in flow/flood callback
	endDT: '',			// literal example '2017-04-14T01:30-0000'
	parameterCd: '00010',
	siteStatus: 'all'
};


// Formatters/Utilities
var tickFormatter = function (value, index, values, type) {	
	if (type == "flow") {
		console.log("got value: "+value);
		return value.toString();
	}
	if (type == "temp") {
		return value.toString();
	}	
}

var toFahrenheit = function (temp) {
	return ( (temp!=null) ? ((temp * (9/5)) + 32) : null );
};
var toCelsius = function (temp) {
	return ( (temp!=null) ? ((temp - 32) * (5/9)) : null );
};

//	Graph Functions
var setupGraphStructures = function () {
	// axes & scales
	xAxis = {
		id: "xAxis",
		type: "time",		// can we pass the moment objects directly?
		position: "bottom",
		gridLines: { 
			display: true,
			color: '#ffffff',
			lineWidth: 1,
			borderDash: [5,2],
			zeroLineWidth: 1,
			zeroLineColor: '#ffffff'
		},
		time:  {
			unit: 'hour',
			displayFormats: {
				month: 'MM',
				day: 'DD',
				hour: 'ddd ha',
				minute: 'mm'
			}
		}
	};
	yAxis_flow = {
		id: "yAxis_flow",
		type: "logarithmic",
		position: "right",
		display: true,
		gridLines: { display: false },
		ticks: {
			callback: function (label, index, labels) {
				return label+"k";
			},
			min: 10,
			max: 100
		},
		scaleLabel: {
			display: true,
			labelString: "Flow Rate (cfs)",
			fontColor: plotColors.flow,
			fontSize: 14
		},
	}
	yAxis_flood = {
		id: "yAxis_flood",
		type: "linear",
		position: "left",
		gridLines: { display: false },
		ticks: {
			min: 5,
			max: 20
		},
		scaleLabel: {
			display: true,
			labelString: "Flood Stage (ft)",
			fontColor: plotColors.flood,
			fontSize: 14
		}
	};
	yAxis_temp = {
		id: "yAxis_temp",
		type: "linear",
		position: "left",
		gridLines: { display: false },
		ticks: {
			min: 0,
			max: 30,
			stepSize: 10,
			callback: function (label, index, labels) {
					return label+"˚C (" + toFahrenheit(Number.parseFloat(label)) + "˚F)";
			}
		},
		scaleLabel: {
			display: true,
			labelString: "Water Temperature (˚C)",
			fontColor: plotColors.temperature,
			fontSize: 14
		},
		color: plotColors.temp
	};
	graphScale = {
		xAxes: [xAxis],
		yAxes: [yAxis_flow, yAxis_temp, yAxis_flood]
	};
	
	// dataset wrapping
	flowDataset = {
		label: "Flow (kcfs)",
		borderColor: plotColors.flow,
		backgroundColor: plotColors.flow,
		fill: false,
		yAxisID: "yAxis_flow",
		data: ordinates.observed.flow
	};
	floodDataset = {
		label: "Flood Stage (ft)",
		borderColor: plotColors.flood,
		backgroundColor: plotColors.flood,
		fill: false,
		yAxisID: "yAxis_flood",
		data: ordinates.observed.flood
	};
	tempDataset = {
		label: "Water Temperature (˚C)",
		borderColor: plotColors.temperature,
		backgroundColor: plotColors.temperature,
		fill: false,
		yAxisID: "yAxis_temp",
		data: ordinates.observed.temp
	};
	graphData = {
		labels: abscissa.observed,
		datasets: [flowDataset, floodDataset, tempDataset]
	};
	
	// options, canvas, & settings
	graphOptions = {
		scales: graphScale,
		legend: {
			position: "bottom",
			labels: {
				fontColor: 'white'
			}
		},
		hidden: false,
		maintainAspectRatio: false
	};
	graphCanvas = $(selectors.graphCanvas).get(0);
	graphSettings = {
		type: "line",
		data: graphData,
		options: graphOptions
	};
};

var renderGraph = function () {
	Chart.defaults.global.defaultFontColor = 'white';
	Chart.defaults.global.elements.point.radius = 1;
	Chart.defaults.global.elements.line.borderWidth = 3;
	Chart.defaults.global.elements.line.tension = 0.8;
	theGraph = new Chart(graphCanvas, graphSettings);
};


// Data Parsing Functions
var parseFlowAndFloodData = function (data) {
	// parse and extract most recent data first
	var latestObservedDatum = $(data).find('observed > datum:first');
	var latestObserved = {
		floodStageMeasurement: $(latestObservedDatum).find('primary').text(),
		floodStageUnits: $(latestObservedDatum).find('primary').attr('units'),
		flowRateMeasurement: $(latestObservedDatum).find('secondary').text(),
		flowRateUnits: $(latestObservedDatum).find('secondary').attr('units')
	};
	// update instantaneous values
	$(selectors.currentFlow).text(latestObserved.flowRateMeasurement + " " + latestObserved.flowRateUnits);
	$(selectors.currentFlood).text(latestObserved.floodStageMeasurement + " " + latestObserved.floodStageUnits);
	// get time-series and forecasted data
	var observedData = $(data).find('site > observed > datum');
	var observedDataN = observedData.length;
	var forecastData = $(data).find('site > forecast > datum');
	var forecastDataN = forecastData.length;
	for(i = 0; i < observedDataN; i++) {
		var datum = $(observedData).get(i);
		var datetime = $(datum).children('valid').text();
		datetime = datetime.substr(0,16);
		var flood = $(datum).children('primary').text();
		var flow = $(datum).children('secondary').text();
		var aMoment = moment(datetime);
		moments.observed[i] = aMoment;
		abscissa.observed[i] = datetime;
		ordinates.observed.flood[i] = Number.parseFloat(flood);
		ordinates.observed.flow[i] = Number.parseFloat(flow);
	}
	moments.forecast = [];
	abscissa.forecast = [];
	for(i = 0; i < forecastDataN; i++) {
		var datum = $(forecastData).get(i);
		var datetime = $(datum).children('valid').text();
		datetime = datetime.substr(0,16);
		var flood = $(datum).children('primary').text();
		var flow = $(datum).children('secondary').text();
		var aMoment = moment(datetime);
		moments.forecast.push(aMoment);
		abscissa.forecast.push(datetime);
		ordinates.forecast.flood[i] = Number.parseFloat(flood);
		ordinates.forecast.flood[i] = Number.parseFloat(flow);
	}
	var obsmin = moment.min(moments.observed);
	var obsmax = moment.max(moments.observed);
	var tempReqFormat = "YYYY-MM-DDTHH:mm-0000";
	temperatureParameters.startDT = obsmin.format(tempReqFormat);
	// temperatureParameters.startDT = moment().subtract(36, 'hours').format(tempReqFormat);
	temperatureParameters.endDT = obsmax.format(tempReqFormat);
	// temperatureParameters.endDT = moment().format(tempReqFormat);
};

var parseTemperatureData = function (data) {
	var tempC = $(data.documentElement).children().find('wml2\\:value:first').text();
	var tempF = toFahrenheit(tempC);
	var latestObserved = {
		celsius: tempC,
		fahrenheit: tempF
	}
	$(selectors.currentTemp).text(tempC + " ˚C");
	// extract timeseries data
	var observedData = $(data.documentElement).children('wml2\\:observationMember').find('wml2\\:point')
	var observedDataN = observedData.length;
	for(i = 0; i < observedDataN; i++) {
		var datum = $(observedData).get(i);
		var datetime = $(datum).find('wml2\\:time').text();
		var temp = $(datum).find('wml2\\:value').text();
		ordinates.observed.temp[i] = Number.parseFloat(temp);
	}
	
	// here: intervene to remove all data in flow and flood from before first temperature reading
	
	renderGraph();
};

var populateDataSets = function () {
	$.ajax({
		url: flowAndFloodSourceURI,
		data: flowAndFloodParameters,
		datatype: 'xml',
		success: function (data) {
			parseFlowAndFloodData(data);
			// hard-chain start
			$.ajax({
				url: temperatureSourceURI,
				data: temperatureParameters,
				datatype: 'xml',
				success: function (data) {
					parseTemperatureData(data);
				}
			});
			// hard-chain end
		}
	});
};