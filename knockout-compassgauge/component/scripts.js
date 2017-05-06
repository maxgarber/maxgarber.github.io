//		Knockout CompassGauge
//		by Maxwell Garber <max.garber+dev@gmail.com>
//		latest revision 2017-05-03

window.onload = function () {

	ko.components.register('compass-gauge', {
		viewModel: function (params) {
			width = ko.observable(params.width + params.dimUnit);
			height = ko.observable(params.height + params.dimUnit);
			
			number = ko.observable(params.number);		// need to live-bind
			units = ko.observable(params.units);
			
			circleX = ko.observable(params.width/2 + params.dimUnit);
			circleY = ko.observable(params.height/2 + params.dimUnit);
			circleR = ko.observable(100);
		},
		template:
			'<div class="CG-container" data-bind="css: {\
				"width": width, "height": height\
			"}">\
				<span class="CG-number" data-bind="text: number">No.</span>\
				<span class="CG-units" data-bind="text: units">units</span>\
				//data-bind component CG-svg\
				\
			</div>'
	});
	
	ko.components.register('CG-svg', {
		viewModel: function (params) {
			
		},
		template: 
			'<svg class="CG-svg">\
				<circle data-bind="attr: { "cx": circleX, "cy": circleY, "r": circleR, "stroke": "black", "stroke-width": 2, "fill": "rgba(0,0,0,0)" }" />\
			</svg>'
	});
		
	ko.applyBindings();
};

//EOF
