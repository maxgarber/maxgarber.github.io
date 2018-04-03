//		RiverStatusBoard: Information for Rowers and Paddlers
//		Allegheny River information for Three Rivers Rowing Association (TRRA)
//		by Maxwell B Garber <max.garber+dev@gmail.com>
//		main.js created on 2017-06-26

//	make requirejs calls here

//	main block - declare before executing
let main = function () {
	var viewModel = new AppViewModel();
	var bindingContext = document.getElementById('koBindingContext');
	ko.applyBindings(viewModel, bindingContext);
	window.vm = viewModel;
	
	setupGraphStructures();
	populateDataSets();
	renderGraph();
	
	// ugly click-to-fahrenheit hack
	var isWaterTempInCelsius = true;
	var waterTempInCelsiusCached = viewModel.waterTemp()
	$('dataField-temp').click(function () {
		// toggle celsius/fahrenheit
	});
};

//	call main once page has loaded
window.onload = function () {
	main();
	window.vm.update();
}
// EOF
