$(document).ready(function() {
	SubsidyCalc.init({
		//some of this data will probably(?) be coming from other data sources
        //we can populate the input fields automatically so we don't have to change the
        //module around or change the module to grab that data, although that does make
        //the module dependent on whatever is supplying that data.
		zip:'[name=zip]',
		size:'[name=size]',
		income:'[name=income]',
		insured:'[name=insured]',
		insuredAgeWrapper:'#insured-age-inputs',
        subsidyResultsWrapper:'#subsidy-content',
        subsidyResultsContent: '#subsidy-details',
        submitButton: '#calculate',
		form:'#subsidy-calc'	
	});

    $('#subsidy-calc').validate({
        rules: {
                zip: {
                    required: true,
                    minlength: 5,
                    maxlength: 5,
                    digits: true
                },
                size: {
                    required: true,
                    minlength: 1,
                    maxlength: 2,
                    digits: true
                },
                income: {
                    required: true,
                    digits: true
                },
                insured: {
                    required: true,
                    minlength: 1,
                    maxlength: 2,
                    digits: true
                }
            },    
    });
});

var SubsidyCalc = (function(){

	function loadJSON(data) {
    	subsidyData = data;
    }

	function handleInsured(evt) {
		$insuredAgeWrapper.html("");
		for (var i = 1; i <= $insured.val(); i=i+1) {
			var template = Handlebars.compile($('#age-insured').html()),
				context = {number:i}
			$insuredAgeWrapper.append(template(context));
        }
    }

    function handleCalculate(evt) {
    	var multiplier = $houseSize.val()-1,
    		fplHouseSize = subsidyData.fpl[0].increment * multiplier + subsidyData.fpl[0].base,
    		found = false,
            planCost = 0,
            template = Handlebars.compile($subsidyResultsContent.html()),
            context,
            contributionAmount;

        $subsidyResultsWrapper.html();

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

                $insuredAgeInputs = $($insuredAgeInputs);
    			$insuredAgeInputs.each(function(index,element) {  
                    console.log(element);
                    var property = $(element).val() === 20 ? "_0_20_child_dependents" : "_" + $(element).val();
                    planCost += parseInt(slcspData[property]);
				});

                context = {
                    monthInsureCost:(planCost - (planCost - (contributionAmount / 12))).toFixed(2),
                    monthCost:planCost.toFixed(2),    
                    yearCost:(planCost*12).toFixed(2),
                    monthTax:(planCost - (contributionAmount / 12)).toFixed(2),
                    yearTax:((planCost * 12) - contributionAmount).toFixed(2),
                }

                $subsidyResultsWrapper.html("");

                $subsidyResultsWrapper.append(template(context));
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

    function handleFormValidation(evt) {
        $formErrors = $($formErrors);
        if($formErrors.length > 0) {
            $submitButton.prop("disabled", true);    
        } else {
            $submitButton.prop("disabled", false); 
        }
           
    }

	function init(opts) {
        $houseSize = $(opts.size);
        $houseIncome = $(opts.income);
        $zip = $(opts.zip);
        $insured = $(opts.insured);
        $insuredAgeWrapper = $(opts.insuredAgeWrapper);
        $insuredAgeInputs = opts.insuredAgeWrapper + ' :input';
        $subsidyResultsContent = $(opts.subsidyResultsContent);
        $subsidyResultsWrapper = $(opts.subsidyResultsWrapper);
        $submitButton = $(opts.submitButton);
        $formErrors = opts.form + ' .error';
        $form = $(opts.form);

        //listen for changes and add the number of needed inputs
        $insured.bind('blur',handleInsured.bind(this));
        //form submission
        $form.bind('submit',handleCalculate.bind(this));

        //Events to validate the form fields along with data retrieval from API on the zip field
        $zip.bind('blur',handleRateRetrieval.bind(this));
    }

	var
        subsidyData,
        slcspData,

        //DOM References
        $houseSize,
        $houseIncome,
        $zip,
        $insured,
        $insuredAgeWrapper,
        $insuredAgeInputs,
        $subsidyResultsWrapper,
        $subsidyResultsContent,
        $submitButton,
        $form,

        publicAPI = {
            init: init,
            loadJSON: loadJSON
        }
    ;
    
    return publicAPI;	
})();

//base is not really the base. bad naming convention by me. I should change it to first or one or something similar...
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