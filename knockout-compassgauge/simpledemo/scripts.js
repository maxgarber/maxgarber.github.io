//		Knockout CompassGauge
//		by Maxwell Garber <max.garber+dev@gmail.com>
//		latest revision 2017-05-03

window.onload = function () {

	function AppViewModel () {
		//	Basics
		this.width = ko.observable(350);
		this.height = ko.observable(350);
		this.styleUnits = ko.observable('px');
		this.needleFill = ko.observable('rgba(255,0,0,0.5)');
		
		//	Digits & Units
		this.number = ko.observable(101);
		this.units = ko.observable('mph');
		this.theta = ko.observable(45);
		
		//	Computed Styling
		this.styleWidth = ko.pureComputed(function() {
			return this.width() + this.styleUnits();
		}, this);
		this.styleHeight = ko.computed(function() {
			return this.height() + this.styleUnits();
		}, this);
		this.svgViewPort = ko.computed(function() {
			return "0 0 " + this.width() + this.styleUnits() + " " + this.height() + this.styleUnits();
		}, this);
		this.svgViewBox = ko.computed(function() {
			return "0 0 " + this.width() + " " + this.height();
		}, this)
		this.unitsHeight = ko.computed(function() {
			return (this.height()/5) + this.styleUnits();
		}, this);
		this.unitsTop = ko.computed(function() {
			return 7.25*this.height()/10 + this.styleUnits();
		}, this)
		
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
		
		//	Compass Needle Polygon
		this.polygonPoints = ko.computed(function() {
			var p1 = this.width()/2 + ',' + 0.05*this.height()/2;
			var p2 = 0.4*this.width() + ',' + 0.96*this.height();
			var p3 = this.width()/2 + ',' + 0.9*this.height();
			var p4 = 0.6*this.width() + ',' + 0.96*this.height();
			return p1+' '+p2+' '+p3+' '+p4;
		}, this);
		this.polygonTransform = ko.computed(function() {
			var transform_str = '';
			transform_str += 'translate('+this.height()/2+this.styleUnits()+','+this.width()/2+this.styleUnits()+')';
			transform_str += ' rotate(' + this.theta() + 'deg)';
			transform_str += ' translate(-'+this.width()/2+this.styleUnits()+',-'+this.height()/2+this.styleUnits()+')';
			return transform_str;
		}, this);
		
	};
	var vm = new AppViewModel();
	window.vm = vm;
	ko.applyBindings(vm);
};

//EOF
