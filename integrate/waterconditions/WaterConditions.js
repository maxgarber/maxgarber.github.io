/*
 *		WaterConditions
 *		by Maxwell Garber <max.garber+dev@gmail.com>
 *		version 0.0.3b (2017/04/13)
 *		WaterConditions.js
 */

/*	Referenced Javascript Libraries		// TODO? use require.js
 *	jQuery
 *	moment
 *	underscore
 *	Chart.js
 *	...
 */

// References
var flowAndFloodSourceURI = "https://water.weather.gov/ahps2/hydrograph_to_xml.php?gage=shrp1&output=xml";
var temperatureSourceURI = "https://waterservices.usgs.gov/nwis/iv/";

var flowAndFloodParameters = {
	gage: 'shrp1',
	output: 'xml'
};
var temperatureParameters = {
	format: 'waterml,2.0',
	sites: '03049640',
	startDT: '',		// literal example '2017-04-12T15:00-0000'
	endDT: '',			// literal example '2017-04-14T01:30-0000'
	parameterCd: '00010',
	siteStatus: 'all'
};

var dataDownsampleFactor = 1;

var plotColors = {
	temperature: '#FF5050',
	flow: '#3377FF',
	flood: '#44EE44'
}

// Utilities
var toFahrenheit = function (temp) {
	return ( (temp!=null) ? ((temp * (9/5)) + 32) : null );
};
var toCelsius = function (temp) {
	return ( (temp!=null) ? ((temp - 32) * (5/9)) : null );
};
var downsample = function(dataArray, rFactor) {
	var downsampledArray = [];
	//	work backward to preserve most recent datum
	var i = dataArray.length - 1;
	var j = Math.floor(dataArray.length/rFactor);
	while (i >= 0) {
		downsampledArray[j] = dataArray[i];
		i -= rFactor;
		j -= 1;
	}
	return downsampledArray;
}

// Formatters
var tickFormatter = function (value, index, values, type) {	
	if (type == "flow") {
		console.log("got value: "+value);
		return value.toString();
	}
	if (type == "temp") {
		return value.toString();
	}	
}

// Data palettes - populated by parser functions
var abscissa = {
	observed: [],
	forecast: []
};
var moments = {
	observed: [],
	forecast: []
};
var ordinates = {
	observed: {
		flow: [],
		flood: [],
		temp: []
	},
	forecast: {
		flow: [],
		flood: [],
		temp: []
	}
};
var units = {
	flow: 'kcfs',
	flood: 'ft',
	temp: '˚C'
};


// Graph Structures
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

// Graph Functions
var setupGraphStructures = function () {
	// axes & scales
	xAxis = {
		id: "xAxis",
		type: "time",		// can we pass the moment objects directly?
		position: "bottom",
		gridLines: { 
			display: true,
			color: '#ffffff',
			lineWidth: 0.5,
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
		position: "left",
		display: true,
		gridLines: { display: true },
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
		}
	}
	yAxis_flood = {
		id: "yAxis_flood",
		type: "linear",
		position: "left",
		gridLines: { display: false },
		ticks: {
			min: 0,
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
		position: "right",
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
		}
	};
	graphScale = {
		xAxes: [xAxis],
		yAxes: [yAxis_flood, yAxis_flow, yAxis_temp]
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
	graphCanvas = $('#graphCanvas').get(0);
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
	$('#flow').text(latestObserved.flowRateMeasurement + " " + latestObserved.flowRateUnits);
	$('#flood').text(latestObserved.floodStageMeasurement + " " + latestObserved.floodStageUnits);
	
	// get time-series and forecasted data
	var observedData = $(data).find('site > observed > datum');
	var observedDataN = observedData.length;
	var forecastData = $(data).find('site > forecast > datum');
	var forecastDataN = forecastData.length;
	
	for(i = 0; i < observedDataN; i += dataDownsampleFactor) {
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
	
	for(i = 0; i < forecastDataN; i += dataDownsampleFactor) {
		var datum = $(forecastData).get(i);
		var datetime = $(datum).children('valid').text();
		datetime = datetime.substr(0,16);
		var flood = $(datum).children('primary').text();
		var flow = $(datum).children('secondary').text();
		
		var aMoment = moment(datetime);
		moments.forecast[i] = aMoment;
		
		abscissa.forecast[i] = datetime;
		ordinates.forecast.flood[i] = Number.parseFloat(flood);
		ordinates.forecast.flood[i] = Number.parseFloat(flow);
	}
	
	var obsmin = moment.min(moments.observed);
	var obsmax = moment.max(moments.observed);
	//var formin = moment.min(moments.forecast);
	//var formax = moment.max(moments.forecast);
	
	//var displayFormat = "YYYY-MM-DDTHH:mm-00:00";
	var tempReqFormat = "YYYY-MM-DDTHH:mm-0000";
	
	//console.log("observed: "+obsmin.format(displayFormat)+" - "+obsmax.format(displayFormat));
	//console.log("forecast: "+formin.format(displayFormat)+" - "+formax.format(displayFormat));
	
	temperatureParameters.startDT = obsmin.format(tempReqFormat);
	temperatureParameters.endDT = obsmax.format(tempReqFormat);	
};

var parseTemperatureData = function (data) {
	// grabs the most recent only for now
	var tempC = $(data.documentElement).children().find('wml2\\:value:first').text();
	var tempF = toFahrenheit(tempC);

	var latestObserved = {
		celsius: tempC,
		fahrenheit: tempF
	}
	
	$('#temp').text(tempC + " ˚C");
	
	// extract timeseries data
	var observedData = $(data.documentElement).children('wml2\\:observationMember').find('wml2\\:point')
	var observedDataN = observedData.length;
	
	for(i = 0; i < observedDataN; i += dataDownsampleFactor) {
		var datum = $(observedData).get(i);
		var datetime = $(datum).find('wml2\\:time').text();
		var temp = $(datum).find('wml2\\:value').text();
		
		// datetime = datetime.substr(0,16);
		// var aMoment = moment(datetime);
		
		ordinates.observed.temp[i] = Number.parseFloat(temp);
	}
	
	renderGraph();
};

// TODO: Wind(!), Weather(?)


// MAIN - initiate execution on window load event
$( window ).on( "load", function() {	
	setupGraphStructures();
	
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
	// TODO: await success of calls & then render graph
});