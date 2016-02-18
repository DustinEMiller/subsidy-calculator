$(document).ready(function() {
	SubsidyCalc.init({
		//zipcode data will come from whatever will be holding the location data
		age:'[name=age]',
		zip:'[name=zip]',
		size:'[name=size]',
		income:'[name=income]',
		insured:'[name=insured]',
		insuredAge:'[name=insuredAge]',
		calculate:'#subsidy-calc'	
	});
});

var SubsidyCalc = (function(){

	function loadJSON(data) {
    	subsidyData = data;
    }

	function handleInsured(evt) {
		$('#insured-age-inputs').html("");
		for (var i = 1; i <= $insured.val(); i=i+1) {
			var template = Handlebars.compile($('#age-insured').html()),
				context = {number:i}
			$('#insured-age-inputs').append(template(context));
        }
    }

    function handleCalculate(evt) {
    	var multiplier = $houseSize.val()-1,
    		fplHouseSize = subsidyData.fpl[0].increment * multiplier + subsidyData.fpl[0].base,
    		found = false,
            planCost = 0,
            template = Handlebars.compile($('#subsidy-details').html()),
            context,
            contributionAmount;

    	subsidyData.fpl.map(function(row, index){
    		var upperValue = row.increment * multiplier + row.base,
    			cIdx = index > 0 ? index - 1 : 0; 

    		if($houseIncome.val() <= upperValue && !found) {
    			var contributionCalc = (($houseIncome.val() / fplHouseSize) * 100 - subsidyData.contribution[cIdx].minEarn) / (subsidyData.contribution[cIdx].maxEarn - subsidyData.contribution[cIdx].minEarn),
    				contributionPercent = ((subsidyData.contribution[cIdx].maxContribution - subsidyData.contribution[cIdx].minContribution) * contributionCalc) + subsidyData.contribution[cIdx].minContribution;

    			if(index === 0) {
    				contributionPercent = subsidyData.contribution[cIdx].minContribution; 	
    			}

    			found = true;

    			contributionAmount = $houseIncome.val() * (contributionPercent / 100);

    			$('#insured-age-inputs :input').each(function(index,element) {  
                    var property = $(element).val() === 20 ? "_0_20_child_dependents" : "_" + $(element).val();
                    planCost += parseInt(slcspData[property]);
				});
                context = {
                    monthInsureCost:planCost - (planCost - (contributionAmount / 12)),
                    monthCost:planCost,    
                    yearCost:planCost*12,
                    monthTax:planCost - (contributionAmount / 12),
                    yearTax:(planCost * 12) - contributionAmount,
                }
                $('#subsidy-content').append(template(context));
    		}	
    	});      
    }

    function handleRateRetrieval(evt) {
    	$.ajax({
            url: 'https://data.healthcare.gov/resource/slcsp-county-zip-reference-data.json?$$app_token=GLTWkiZboiivpk9dcDz0GXvnP&zip_code=' + $zip.val(),
            dataType: 'json',
            complete: function(jqXHR, status) {

                switch (status) {
                    case 'success':
                        slcspData = JSON.parse(jqXHR.responseText)[0];
                        break;
                    default:
                    	console.log('error');
                        break;
                }
            }
        });      
    }

	function init(opts) {
        $houseSize = $(opts.size);
        $houseIncome = $(opts.income);
        $zip = $(opts.zip);
        $age = $(opts.age);
        $insured = $(opts.insured);
        $insuredAge = $(opts.insuredAge);
        $calculate = $(opts.calculate);

        //listen for changes and add the number of needed inputs
        $insured.bind('blur',handleInsured.bind(this));
        //form submission
        $calculate.bind('submit',handleCalculate.bind(this));

        $zip.bind('blur',handleRateRetrieval.bind(this));
    }

	var
        subsidyData,
        slcspData,

        //DOM References
        $houseSize,
        $houseIncome,
        //This reference will need to be changed in production to whatever is holding the location data
        $zip,
        $age,
        $insured,
        $insuredAge,
        $calculate,

        publicAPI = {
            init: init,
            loadJSON: loadJSON
        }
    ;
    
    return publicAPI;	
})();

/*SubsidyCalc.loadJSON(
	[{"lowFpl": 0, "minEarn":100, "maxEarn":133, "minContribution":2.03, "maxContribution":2.03, "base":11770, "increment":4160},
	{"lowFpl": 100, "minEarn":133, "maxEarn":150, "minContribution":3.05, "maxContribution":4.07, "base":15654, "increment":5533},
	{"lowFpl": 133, "minEarn":150, "maxEarn":200, "minContribution":4.07, "maxContribution":6.41, "base":17655, "increment":6240},
	{"lowFpl": 150, "minEarn":200, "maxEarn":250, "minContribution":6.41, "maxContribution":8.18, "base":23540, "increment":8320},
	{"lowFpl": 200, "minEarn":250, "maxEarn":300, "minContribution":8.18, "maxContribution":9.66, "base":35310, "increment":12480},
	{"lowFpl": 250, "minEarn":300, "maxEarn":400, "minContribution":9.66, "maxContribution":9.66, "base":47080, "increment":16640}]
);*/

SubsidyCalc.loadJSON(
	{"fpl":[
		{"percent":100, "base":11770, "increment":4160},
		{"percent":133, "base":15654, "increment":5533},
		{"percent":150, "base":17655, "increment":6240},
		{"percent":200, "base":23540, "increment":8320},
		{"percent":300, "base":35310, "increment":12480},
		{"percent":400, "base":47080, "increment":16640}
	],
	"contribution":[
		{"minEarn":0,"maxEarn":133,"minContribution":2.03,"maxContribution":2.03},
		{"minEarn":133,"maxEarn":150,"minContribution":3.05,"maxContribution":4.07},
		{"minEarn":150,"maxEarn":200,"minContribution":4.07,"maxContribution":6.41},
		{"minEarn":200,"maxEarn":250,"minContribution":6.41,"maxContribution":8.18},
		{"minEarn":250,"maxEarn":300,"minContribution":8.18,"maxContribution":9.66},
		{"minEarn":300,"maxEarn":400,"minContribution":9.66,"maxContribution":9.66}
	]}
);