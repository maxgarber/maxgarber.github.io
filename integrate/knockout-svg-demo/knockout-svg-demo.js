//	Knockout-SVG Demo
//	by Maxwell B Garber <max.garber+dev@gmail.com>
//	laste revised 2017-05-02

window.onload = function () {

	//	utility functions
	var addUnitSuffix = function(value, units) {
		return '' + value + units;
	}
	var percentForLength = function(length, boundingLength) {
		return '' + (100 * (length / boundingLength)) + "%";
	}

	//	VM
	function AppViewModel() {
		this.width = ko.observable(500);

		this.height = ko.observable(500);

		this.units = ko.observable('px');

		this.centerX = ko.computed(function() {
			return this.width() / 2;
		}, this);

		this.centerY = ko.computed(function() {
			return this.height() / 2;
		}, this);

		this.svgWidth = ko.computed(function() {
			return addUnitSuffix(this.width(), this.units());
		}, this);

		this.svgHeight = ko.computed(function() {
			return addUnitSuffix(this.height(), this.units());
		}, this);

		this.svgViewport = ko.computed(function() {
			var vp_str = "0 0 " + this.width() + " " + this.height();
			//console.log("viewport<="+vp_str);
			return vp_str;
		}, this);

		this.theta = ko.observable(45);

		this.polygonPoints = ko.computed(function() {
			var p1 = ('' + this.centerX() + ',' + 0.05 * this.height());
			var p2 = ('' + (0.4 * this.width()) + ',' + 0.95 * this.height());
			var p3 = ('' + this.centerX() + ',' + 0.9 * this.height());
			var p4 = ('' + (0.6 * this.width()) + ',' + 0.95 * this.height());

			return p1 + ' ' + p2 + ' ' + p3 + ' ' + p4;
		}, this);

		this.transformOriginX = ko.computed(function() {
			return this.width() / 2;
		}, this);

		this.transformOriginY = ko.computed(function() {
			return this.height() / 2;
		}, this);

		this.transform = ko.computed(function() {
			var transform_str = '';
			transform_str += 'translate(250px,250px)';
			transform_str += ' rotate(' + this.theta() + 'deg)';
			transform_str += ' translate(-250px,-250px)';
			//console.log('transform<= '+transform_str);
			return transform_str;
		}, this);

		this.update = function() {
			var phi = document.getElementById('slider').value;
			this.theta(phi);
		};

	}
	var vm = new AppViewModel();
	ko.applyBindings(vm);


	//	Animation -- disabled demo feature
	var n = 0;
	var m = 3;
	var p = 10;
	var spinner = function() {
		var _theta = vm.theta();
		_theta += 5;
		if (_theta >= 360) {
			_theta = 0;
			n++;
			//console.log("n="+n);
		}
		vm.theta(_theta);
		if (n >= m) {
			clearInterval(looper);
		}
	};
	var looper = setInterval(spinner, p);
};

//EOF
