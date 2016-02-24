#Subsidy Calculator
##Dependencies
```jquery 1.11.3```
```handlebars 2.0.2``` 
```jquery.validate 1.14.0```

##Initialization Options
Currently, these are all required and pretty self explanatory:
```zip:``` Selector for the input that will contain the zipcode
```size:``` Selector for the input that will contain the size of the household
```income:``` Selector for the input that will contain the income for the household
```insured:``` Selector for the input that will contain the number of insured people in the household
```insuredAgeWrapper:``` Selector for the tag that will wrap around the age inputs
```subsidyResultsWrapper:``` Selector for the tag that will contain the results
```subsidyTemplate:``` Selector for the handlebars template that will be used for the subsidy results
```submitButton:``` Selector for the submit button on the form
```ageTemplate:``` Selector for the handlebars template that will be used for the age inputs
```ageInputPrefixWrapper:``` Selector for the prefix (#age-input-{{number}}) on the wrapper that will contain the age input and label
```ageInputPrefix:``` Selector for the prefix on the age input ([name=age-insured-). Currently, this must be a name selector
```form:``` Selector for the form
