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
        subsidyTemplate: '#subsidy-details',
        submitButton: '#calculate',
        ageTemplate: '#age-insured',
        ageInputPrefixWrapper:'#age-input-',
        ageInputPrefix:'[name=age-insured-',
		form:'#subsidy-calc'	
	});

    $.validator.addMethod("zipcodeUS", function(value, element) {
        return this.optional(element) || /\d{5}$/.test(value)
    }, "The specified US ZIP Code is invalid");

    $.validator.addMethod("insureeCheck", function(value, element) {
        return !isNaN(parseInt($('[name=size]').val())) && value <= parseInt($('[name=size]').val())
    }, "Number of insured people must be equal to or smaller than the number of people in your household");

    $('#subsidy-calc').validate({
        rules: {
                zip: {
                    required: true,
                    minlength: 5,
                    maxlength: 5,
                    zipcodeUS: true,
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
                    insureeCheck: true,
                    digits: true
                }
            },    
    });

});

var SubsidyCalc = (function(){

	function loadJSON(data) {
    	subsidyData = data;
    }

    function formValidation() {     
        var isValid = true;

        if(!$form.valid()) {
            isValid = false;

        } 

        if ( typeof(slcspData) === "undefined" || slcspData === null ) {
            isValid = false;
        }   

        return isValid;   
    }

	function handleInsured(evt) {
        if($insured.valid()){
            var length = $($insuredAgeInputs).length,
            startingVal = length <= 0 ? 0 : length;

            if (length > $insured.val()) {
                for (var i = 1; i <= length - parseInt($insured.val()); i=i+1) {
                    var number = parseInt($insured.val()) + i;
                    $(ageInputPrefixWrapper+number).remove();
                }
            } else { 
                for (var i = startingVal; i < parseInt($insured.val()); i=i+1) {
                    var template = Handlebars.compile($ageTemplate.html()),
                        context = {number:i+1}
                    $insuredAgeWrapper.append(template(context));

                    $(ageInputPrefix+context.number+"]").rules( "add", {
                        digits: true
                    });
                }
            }
        }
    }

    function handleCalculate(evt) {
        var multiplier = $houseSize.val()-1,
            fplHouseSize = subsidyData.fpl[0].increment * multiplier + subsidyData.fpl[0].base,
            planCost = 0,
            template = Handlebars.compile($subsidyTemplate.html()),
            context = {},
            contributionAmount;

            context.found = false;
            context.medicaid = false;

        if(formValidation()) {

            subsidyData.fpl.map(function(row, index){
                var upperValue = row.increment * multiplier + row.base,
                    cIdx = index > 0 ? index - 1 : 0,
                    insuredAgeInputs = $($insuredAgeInputs);

                if($houseIncome.val() <= upperValue && !context.found) {
                    var contributionCalc = (($houseIncome.val() / fplHouseSize) * 100 - subsidyData.contribution[cIdx].minEarn) / (subsidyData.contribution[cIdx].maxEarn - subsidyData.contribution[cIdx].minEarn),
                        contributionPercent = ((subsidyData.contribution[cIdx].maxContribution - subsidyData.contribution[cIdx].minContribution) * contributionCalc) + subsidyData.contribution[cIdx].minContribution;

                    console.log(contributionCalc);
                    console.log(contributionPercent);
                    console.log(row);

                    if(index === 0) {
                        contributionPercent = subsidyData.contribution[cIdx].minContribution;   
                    }
                    
                    contributionAmount = $houseIncome.val() * (contributionPercent / 100);

                    insuredAgeInputs.each(function(index,element) {
                        var property = parseInt($(element).val()) <= 20 ? "_0_20_child_dependents" : "_" + $(element).val();
                        planCost += parseInt(slcspData[property]);
                    });

                    if((planCost - (contributionAmount / 12)).toFixed(2) > 0) {
                        if (parseInt(row.percent) <= 133) {
                            context.medicaid = true;
                        }
                        context.found = true;
                        context.monthInsureCost = (planCost - (planCost - (contributionAmount / 12))).toFixed(2);
                        context.monthCost = planCost.toFixed(2);   
                        context.yearCost = (planCost*12).toFixed(2);
                        context.monthTax = (planCost - (contributionAmount / 12)).toFixed(2);
                        context.yearTax = ((planCost * 12) - contributionAmount).toFixed(2);
                    }
                }   
            });
            $subsidyResultsWrapper.html(template(context));
            $subsidyResultsWrapper.show();
        }     
    }

    function handleRateRetrieval(evt) {
        var zipcode = $zip.val();

        if(zipcode){
            $.ajax({
                url: 'https://data.healthcare.gov/resource/slcsp-county-zip-reference-data.json?$$app_token=GLTWkiZboiivpk9dcDz0GXvnP&zip_code=' + zipcode,
                dataType: 'json',
                complete: function(jqXHR, status) {

                    switch (status) {
                        case 'success':
                            slcspData = JSON.parse(jqXHR.responseText)[0];
                            break;
                        default:
                            slcspData = null;
                            break;
                    }
                }
            });  
        }
    	    
    }

	function init(opts) {
        $houseSize = $(opts.size);
        $houseIncome = $(opts.income);
        $zip = $(opts.zip);
        $insured = $(opts.insured);
        $insuredAgeWrapper = $(opts.insuredAgeWrapper);
        $insuredAgeInputs = opts.insuredAgeWrapper + ' :input';
        $subsidyTemplate = $(opts.subsidyTemplate);
        $subsidyResultsWrapper = $(opts.subsidyResultsWrapper);
        $submitButton = $(opts.submitButton);
        $ageTemplate = $(opts.ageTemplate);
        $form = $(opts.form);

        formString = opts.form;
        ageInputPrefixWrapper = opts.ageInputPrefixWrapper
        ageInputPrefix = opts.ageInputPrefix;

        $subsidyResultsWrapper.hide();

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
        formString,
        ageInputPrefixWrapper,
        ageInputPrefix,

        //DOM References
        $houseSize,
        $houseIncome,
        $zip,
        $insured,
        $insuredAgeWrapper,
        $insuredAgeInputs,
        $subsidyResultsWrapper,
        $subsidyTemplate,
        $submitButton,
        $ageTemplate,
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