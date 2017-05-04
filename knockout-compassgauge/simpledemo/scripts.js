//		Knockout CompassGauge
//		by Maxwell Garber <max.garber+dev@gmail.com>
//		latest revision 2017-05-03

window.onload = function () {

	function AppViewModel () {
		
		//	Basics
		this.width = ko.observable(250);
		this.height = ko.observable(250);
		this.styleUnits = ko.observable('pt');
		
		//	Digits & Units
		this.number = ko.observable(101);
		this.units = ko.observable('mph');
		
		//	Computed Styling
		this.styleWidth = ko.pureComputed(function() {
			return this.width() + this.styleUnits();
		}, this);
		this.styleHeight = ko.computed(function() {
			return this.height() + this.styleUnits();
		}, this);
		this.viewbox = ko.computed(function() {
			return "0 0 " + this.width() + " " + this.height();
		});
		
		//	Units Styling
		this.unitsHeight = ko.computed(function() {
			return "50pt";
		});
		this.unitsTop = ko.computed(function() {
			return "175pt";
		})

		
		//	Perimeter Circle
		this.circleStrokeWidth = ko.observable(2);
		this.circleStrokeColor = ko.observable('black');
		this.circleFill = ko.observable("rgba(0,0,0,0)");
		
		this.circleX = ko.computed(function() {
			return this.width() / 2;
		}, this);
		this.circleY = ko.computed(function() {
			return this.height() / 2;
		}, this);
		this.circleR = ko.computed(function() {
			return (this.circleX() - this.circleStrokeWidth());
		}, this);
		
		
		
		//	Debug attachment
		window.vm = this;
	};
		
	ko.applyBindings(AppViewModel);
};

//EOF
