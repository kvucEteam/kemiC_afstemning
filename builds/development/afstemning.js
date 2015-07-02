

//###############################################################################################
//                       Utility functions 
//###############################################################################################



function CountSubstring(str, subStr){  // http://rosettacode.org/wiki/Count_occurrences_of_a_substring#JavaScript
    var StrPos = str.indexOf(subStr, 0);
    console.log("CountSubstring2 - StrPos 1: " + StrPos );
    var Count = 0;
    while ((StrPos !== -1) && (Count < 1000)) {
        ++Count;
        StrPos = str.indexOf(subStr, StrPos + 1);
        console.log("CountSubstring2 - Count: " + Count + ", StrPos 2: " + StrPos );
    };
    return Count;
}
console.log("CountSubstring2 : " + CountSubstring("ABCDEFGH ABCDEFGH ABCDEFGH IJK", "M") );


function ReturnUniqueArray(MyArray){
    var MyArrayStr = MyArray.join(",");
    console.log("ReturnUniqueArray - MyArrayStr: " + MyArrayStr);
    for (var x in MyArray){
        if (CountSubstring(MyArrayStr, MyArray[x]) > 1) { 
            MyArray.splice(x, 1);
            MyArrayStr = MyArray.join(","); 
        }
    }
    return MyArrayStr.split(",");
}

console.log("ReturnUniqueArray : " + ReturnUniqueArray([1,2,3,4,1,2,3,4]) );
console.log("ReturnUniqueArray : " + ReturnUniqueArray(["a","b","c","d","e","a","b","c"]) ); 




//###############################################################################################
//                              ChemLatexToHtml
//###############################################################################################

var JsonData;

// var JsonExternalData;

var QuizArray = [];

var ChemDataObj = { ChemEq: null, 
                    ChemEqHtml: null, 
                    ChemEqHtmlDropDown: null,
                    ArgObj: {}, 
                    CorrectAnswerObj: {},
                    NumOfCorrectAnswers: 0,
                    NumOfWrongAnswers: 0,
                    NumOfAttempts: 0
                };

var TotScoreObj = { NewTotNumOfWrongAnswers: 0,
                    MemTotNumOfWrongAnswers: 0,
                    TotNumOfCorrectAnswers: 0,
                    TotNumOfWrongAnswers: 0,
                    TotNumOfAttempts: 0
                };

var QuestionNum = 0;

var Level = 1; // Level assigns the difficulty level of the task


var MaxNumOfElements = 10;



function ReturnAjaxData(Type, Url, Async, DataType){
    $.ajax({
        type: Type,
        url: Url,
        async: Async,
        dataType: DataType,
        success: function(Data){
            console.log( "ReturnAjaxData: " + JSON.stringify(Data) );
            JsonData = JSON.parse(JSON.stringify(Data));  
            // JsonExternalData = JSON.parse(JSON.stringify(Data));
        }
    });
}


function LatexEnclosedPramToHtml(LatexStr, Delimiter){

    var StartPos = 0; var EndPos = 0; var Val = ""; var count = 0;
    do {
        StartPos = LatexStr.indexOf(Delimiter+"{", EndPos); 
        if (StartPos !== -1){
            EndPos = LatexStr.indexOf("}", StartPos+2);
            if (EndPos !== -1){
                Val = LatexStr.substring(StartPos+2, EndPos);
                LatexStr = LatexStr.substring(0,StartPos) + ((Delimiter == "^")?'<sup class="ChargeNum">'+Val+'</sup>':'<sub class="IndexNum">'+Val+'</sub>') + LatexStr.substring(EndPos+1);
            }
            else{
                alert("Fejl i LaTex udtryk:\nStart-tuborg-parentes "+ String(StartPos) + " tegn inde i LaTex-udtrykket har ikke en slut-tuborg-parentes!");
                break;
            }
        }
        ++count;
    } while ((StartPos !== -1) &&  (count < 100));

    return LatexStr;
}


function LatexPramToHtml(LatexStr, Delimiter){

    var StartPos = 0; var Val = ""; var count = 0;
    do {
        StartPos = LatexStr.indexOf(Delimiter); 
        if (StartPos !== -1){
            Val = LatexStr.substring(StartPos+1, StartPos+2);
            LatexStr = LatexStr.substring(0,StartPos) + ((Delimiter == "^")?'<sup class="ChargeNum">'+Val+'</sup>':'<sub class="IndexNum">'+Val+'</sub>') + LatexStr.substring(StartPos+2);
        }
        ++count;
    } while ((StartPos !== -1) &&  (count < 100));

    return LatexStr;
}


function LatexCoeffToHtml(LatexStr){
    // var CoeffArray = LatexStr.match(/((\ \d+)|^\d)/g);  
    var CoeffArray = LatexStr.match(/((\ #\d+)|^#\d|(\ \d+)|^\d)/g);  
    // var CoeffArray = LatexStr.match(/((^#[A-Z])|(\ #[A-Z])|(\ #\d+)|^#\d|(\ \d+)|^\d)/g); 
    console.log("LatexCoeffToHtml - LatexStr: " + LatexStr + ", CoeffArray 1: " + CoeffArray);
    console.log("LatexCoeffToHtml - LatexStr: " + LatexStr + ",  CoeffArray 2: " + CoeffArray);
    var StartPos = 0;
    for (var i in CoeffArray){
        StartPos = LatexStr.indexOf(CoeffArray[i], StartPos);
        if (StartPos !== -1){
            if (StartPos == 0){
                LatexStr = "<span class='CoeffNum'>"+LatexStr.substring(0,CoeffArray[i].length)+"</span>"+LatexStr.substring(CoeffArray[i].length);
            } else {
                LatexStr = LatexStr.substring(0,StartPos)+" <span class='CoeffNum'>"+CoeffArray[i].replace(" ", "")+"</span>"+LatexStr.substring(StartPos+CoeffArray[i].length);
            }
        }
    }
    return LatexStr;
}
// console.log("LatexCoeffToHtml: " + LatexCoeffToHtml("1A + 2B + 3C + 4D + 5E + 331K") );


function SplitChemEqIntoReactantsAndProducts(LatexStr, Delimiter){
    if (LatexStr.indexOf(Delimiter) !== -1){ // I the delimiter is present:
        var ChemEq = LatexStr.split(Delimiter);
        var HTML = "";
        for (var i in ChemEq){
            HTML +='<span class="'+((i==0)?'Reactants':'Products')+'">'+ChemEq[i]+'</span>'+((i==0)?'<span class="ChemArrowWrap">'+Delimiter+'</span>':'');
        }
        console.log("SplitChemEqIntoReactantsAndProducts - HTML: " + HTML ); 
        return HTML;
    } else {
        return LatexStr;
    }
}


// Predefined Delimiter = ";"
function SplitChemEqAndVarArgs(DataStr){
    // var ChemDataObj = {ChemEq: null, ArgObj: {}};
    var TArgArray = [];
    var DataComponents = DataStr.split(";");
    for (var i in DataComponents){
        if (i == 0)
            ChemDataObj.ChemEq = DataComponents[i].trim();
        else
            TArgArray.push(DataComponents[i].trim());
    }
    console.log("SplitChemEqAndVarArgs - DataComponents 1: " + DataComponents );
    console.log("SplitChemEqAndVarArgs - ChemDataObj 1: " + JSON.stringify(ChemDataObj) ); 
    console.log("SplitChemEqAndVarArgs - TArgArray: " + TArgArray); 
    var TArray; var Sign1; var Val1; var Sign2; var Val2; var ErrStr = "";
    for (var s in TArgArray){

        // NOTE: MAKE AN ERROR-CHECK FUNCTION INSTEAD OF THE FOLLOWING CHECKS!!! 
        //       CHARGES: check also for the right use of X-:Y-, X-:0, X-:Y+ or X+:Y+ where X>Y for "-" and X<Y for "+".
        //       INDEX and COEFF: check for the right use of X:Y where 0<=X<Y.
        //       Check for only one ":" in each argument.

        if ((TArgArray[s].indexOf(":") !== -1) && (TArgArray[s].indexOf(",") !== -1)){
            alert('Der kan ikke både bruges ":" og "," i samme argument!');
            throw new Error('PROGRAM TERMINATED DUE TO USER INPUT ERROR: illegal use of both ":" and "," in the same argument');
        }
        if (TArgArray[s].indexOf(" ") !== -1){
            alert('Der må ikke være mellemrumstegn i argumentet!');
            throw new Error('PROGRAM TERMINATED DUE TO USER INPUT ERROR: illegal use of blankspace character in the argument');
        }

        if (TArgArray[s].indexOf(":") !== -1){
            var NumArray = [];
            TArray = TArgArray[s].split(":");
            Sign1 = ((TArray[0].indexOf("+")!==-1)?"+":"")+((TArray[0].indexOf("-")!==-1)?"-":"");
            Val1 = parseInt(TArray[0].replace("+","").replace("-",""));
            Sign2 = ((TArray[1].indexOf("+")!==-1)?"+":"")+((TArray[1].indexOf("-")!==-1)?"-":"");
            Val2 = parseInt(TArray[1].replace("+","").replace("-",""));

            console.log("SplitChemEqAndVarArgs - i: " + i + ", TArray: " + TArray); 
            console.log("SplitChemEqAndVarArgs - Sign1: " + Sign1 + ", Val1: " + Val1 + ", Sign2: " + Sign2 + ", Val2: " + Val2); 

            if ((Sign1 == "-") && (Sign2 == "-")){  // X-:Y-
                ErrStr += "A ";
                for (var i = Val1; i >= Val2; i--) {
                    NumArray.push(String(i)+"-");
                };
            }

            if ((Sign1 == "+") && (Sign2 == "+")){   // X+:Y+
                ErrStr += "B ";
                for (var i = Val1; i <= Val2; i++) {
                    NumArray.push(String(i)+"+");
                };
            }

            if ((Sign1 == "-") && (Sign2 == "+")){   // X-:Y+
                ErrStr += "C ";
                for (var i = Val1; i >= 0; i--) {
                    NumArray.push(String(i)+((i==0)?"":"-"));
                };
                for (var i = 1; i <= Val2; i++) {
                    NumArray.push(String(i)+"+");
                };
            }

            if ((Sign1 == "-") && (Sign2 == "")){   // X-:0
                ErrStr += "D ";
                for (var i = Val1; i >= 0; i--) {
                    NumArray.push(String(i)+((i==0)?"":"-"));
                };
            }

            if ((Sign1 == "") && (Sign2 == "+")){  // 0:Y+
                ErrStr += "E ";
                for (var i = 0; i <= Val2; i++) {
                    NumArray.push(String(i)+((i==0)?"":"+"));
                };
            }

            if ((Sign1 == "") && (Sign2 == "")){  // X:Y
                ErrStr += "F ";
                for (var i = Val1; i <= Val2; i++) {
                    NumArray.push(String(i));
                };
            }
            console.log("SplitChemEqAndVarArgs - ErrStr: " + ErrStr);
            console.log("SplitChemEqAndVarArgs - NumArray 1: " + NumArray);

            ChemDataObj.ArgObj[s] = NumArray;
        }

        if (TArgArray[s].indexOf(",") !== -1){
            TArray = TArgArray[s].split(",");
            ChemDataObj.ArgObj[s] = TArray;
        }
    }

    console.log("SplitChemEqAndVarArgs - NumArray 2: " + NumArray);
    console.log("SplitChemEqAndVarArgs - ChemDataObj 2: " + JSON.stringify(ChemDataObj) );
}


// Due to need of comparing a value (either 0 to n or X- to Y- ) choosen from a drop-down-menu with a value supplied by the techer 
function MultiplyMarkedFactorsByOne(LatexStr, Delimiter){

    // The following code tranformes "#A" to "#1A" and "#Aa" to "#1Aa"  AND  "#+" to "#1+" and "#-" to "#1-":
    var CoeffArray = LatexStr.match(new RegExp("((^"+Delimiter+"[A-Z])|(\ "+Delimiter+"[A-Z])|("+Delimiter+"\\+)|("+Delimiter+"-))", 'g'));
    console.log("MultiplyMarkedFactorsByOne - CoeffArray: " + CoeffArray );
    var NewStr;
    for (var s in CoeffArray){
        CoeffArray[s] = CoeffArray[s].trim();
        NewStr = CoeffArray[s].substring(0,Delimiter.length)+"1"+CoeffArray[s].substring(Delimiter.length);
        LatexStr = LatexStr.replace(CoeffArray[s], NewStr);
    }

    return LatexStr;
}
// console.log("MultiplyMarkedFactorsByOne: " + MultiplyMarkedFactorsByOne("#Aa + Bb + #Cc + Dd", "#") );


// This function removes any unity-factors (e.g. "1") from a chemical equation, since this is not a correct way of writing the equation.
function RemoveDelimiterAndUnityFactors(LatexStr, Delimiter){
    
    // The following code searches for "#1<", "#1+" and "#1-". Note: "#1<" is present in: "<span class='Coeff'>#1</span>"
    var CoeffArray = LatexStr.match(new RegExp("(("+Delimiter+"1<)|("+Delimiter+"1\\+)|("+Delimiter+"1-))", 'g'));
    console.log("RemoveDelimiterAndUnityFactors - CoeffArray: " + CoeffArray );
    var NewStr;
    for (var s in CoeffArray){
        CoeffArray[s] = CoeffArray[s].trim();
        NewStr = CoeffArray[s].substring(Delimiter.length + 1);
        console.log("RemoveDelimiterAndUnityFactors - CoeffArray[s]: " + CoeffArray[s] + ", NewStr: " + NewStr);
        LatexStr = LatexStr.replace(CoeffArray[s], NewStr);
    }

    LatexStr = LatexStr.replace(new RegExp(Delimiter, 'g'), "");  // This removes all other instances of "#".

    return LatexStr;
}


function ChemLatexToHtml(DataStr){

    SplitChemEqAndVarArgs(DataStr);

    LatexStr = ChemDataObj.ChemEq;
    console.log("ChemLatexToHtml - LatexStr 1: " + LatexStr);

    LatexStr = MultiplyMarkedFactorsByOne(LatexStr, "#");
    console.log("ChemLatexToHtml - LatexStr 2: " + LatexStr);

    // IMPORTANT NOTE: LatexEnclosedPramToHtml() has to be called before LatexPramToHtml() because of delimiters "_{" and "^{" contains the "{" start-bracket.
    LatexStr = LatexEnclosedPramToHtml(LatexStr, "_");  
    LatexStr = LatexEnclosedPramToHtml(LatexStr, "^");
    LatexStr = LatexPramToHtml(LatexStr, "_");
    LatexStr = LatexPramToHtml(LatexStr, "^");
    LatexStr = LatexCoeffToHtml(LatexStr);
    LatexStr = SplitChemEqIntoReactantsAndProducts(LatexStr, "--->");
    console.log("ChemLatexToHtml - LatexStr 3: " + LatexStr);

    // ChemDataObj.ChemEqHtml = LatexStr.replace(/#/g, "");
    ChemDataObj.ChemEqHtml = RemoveDelimiterAndUnityFactors(LatexStr, "#");
    console.log("ChemLatexToHtml - ChemEqHtml: " + ChemDataObj.ChemEqHtml);

    ChemDataObj.ChemEqHtmlDropDown = AddDropdownToDelimiterTag( LatexStr, "#", "Id");
    console.log("ChemLatexToHtml - ChemEqHtmlDropDown: " + ChemDataObj.ChemEqHtmlDropDown);

    console.log("ChemLatexToHtml - ChemDataObj: " + JSON.stringify(ChemDataObj) );

    // return LatexStr;
}
// console.log("ChemLatexToHtml 1: " + ChemLatexToHtml("Fe_{2}(SO_{4})_{3} + H_{2}O ----> 2Fe^{3+} + 3SO_{4}^{2+}") );



function AddDropdownToDelimiterTag(LatexStr, Delimiter, ClassId){  // ChemDataObj

    var StartPos = 0; var EndPos = 0; var Val = ""; var count = 0; var StartTagPos; var EndTagPos; var TagContent; var ClassPos; var StartStr; var EndStr;
    var ErrStr = ""; var HTML = ""; var TArray; var NumStr; var CorrectAnswer;
    var DropDownCount = 0;
    console.log("AddDropdownToDelimiterTag - ChemDataObj: " + JSON.stringify(ChemDataObj) );
    
    if (LatexStr.indexOf(Delimiter, StartPos) !== -1)  // Prevents creation of a single drop-down-menu if no delimiter (e.g. "#") is given.
        do {
            StartPos = LatexStr.indexOf(Delimiter, StartPos); 
            StartTagPos = LatexStr.indexOf("<", StartPos);
            EndTagPos = LatexStr.lastIndexOf(">", StartPos);
            console.log("AddDropdownToDelimiterTag - StartPos: " + StartPos + ", StartTagPos: " + StartTagPos + ", EndTagPos: " + EndTagPos);
            StartStr = LatexStr.substring(0,EndTagPos+1);
            EndStr = LatexStr.substring(StartTagPos);
            console.log("AddDropdownToDelimiterTag - StartStr: " + StartStr + ", EndStr: " + EndStr);
            CorrectAnswer = LatexStr.substring(EndTagPos+1, StartTagPos).replace("#", "");
            ChemDataObj.CorrectAnswerObj[DropDownCount] = CorrectAnswer;
            Sign = ((CorrectAnswer.indexOf("+")!==-1)?"+":"")+((CorrectAnswer.indexOf("-")!==-1)?"-":"");
            console.log("AddDropdownToDelimiterTag - ChemDataObj.CorrectAnswerObj: " + JSON.stringify(ChemDataObj.CorrectAnswerObj) );

            HTML = '<select class="'+ClassId+' bund_select" id="'+ClassId+String(DropDownCount)+'">'; //  bund_select
            HTML += '<option selected value="?">?</option>';
            if (ChemDataObj.ArgObj.hasOwnProperty(DropDownCount)) {
                TArray = ChemDataObj.ArgObj[DropDownCount];
                for (var i in TArray) {
                    HTML += '<option value="'+TArray[i]+'">'+TArray[i]+'</option>';
                };
                // ++DropDownCount;
            } else {
                for (var i = 0; i < 10; i++) {
                    NumStr = (i != 0) ? i+Sign : i;
                    HTML += '<option value="'+NumStr+'">'+NumStr+'</option>';
                };
            }
            ++DropDownCount;
            HTML += '</select>';
            console.log("AddDropdownToDelimiterTag - HTML: " + HTML);
            LatexStr = StartStr + HTML + EndStr;
            StartPos = LatexStr.indexOf(Delimiter, StartPos)
            console.log("AddDropdownToDelimiterTag - StartPos 1: " + StartPos);
            ++count;
        } while ((StartPos !== -1) &&  (count < 100));
    console.log("AddDropdownToDelimiterTag - ErrStr: " + ErrStr);
    return LatexStr;
}


function GetSelectedData(TargetClass, Delimiter){  // ChemWrap2

    // "On change" example - SEE:   
    //      http://fiddle.jshell.net/3gCKH/
    //      http://stackoverflow.com/questions/17039741/get-data-attribute-for-selected-dropdown-options
    var NumOfAnswersCount = 0;
    var CorrectAnswerCount = 0;
    var FailedAnswerCount = 0;
    var AttemptCount = 0;
    var CorrectObj = {};
    var FailedObj = {};
    var OldValObj = {};
    var TOldValObj = {};
    // var NumOfCorrectAnswers = 0;
    for (var i in ChemDataObj.CorrectAnswerObj){
        CorrectObj[i] = 0;  // Counter/tracker to see which dropdowns are correct
        FailedObj[i] = 0;   // Counter/tracker to see which dropdowns are wrong 
        OldValObj[i] = "?";  // <--- IMPORTANT: Here "null" has to be a string, since it's a string in the HTML option-tag.
        // ++NumOfCorrectAnswers;
    }
    var ErrStr = ""; var UnsignedNum;
    console.log("GetSelectedData - CorrectObj: " + JSON.stringify(CorrectObj) );
    // $("."+TargetClass).on('change',function(){
        // var NumCorrection = $("."+TargetClass).length;

        console.log("GetSelectedData - RUNS: ");

        $("."+TargetClass).each(function( index, element ) {
            var Data = $('select#'+TargetClass+index+' option:selected').text();
            if ((OldValObj[index] != Data)){
                if (Data != ""){
                    ErrStr += "A ";
                    if (Data == ChemDataObj.CorrectAnswerObj[index]){
                        ErrStr += "B ";
                        ++CorrectAnswerCount;
                        CorrectObj[index] += 1;

                        // Code for changing the drop-down-menu to the correct answer:
                        var ParentObj = $('select#'+TargetClass+index).parent();
                        ParentObj.addClass($(element).prop("class"));  // This is nesseary for "index" count in "$("."+TargetClass)" to be correct.
                        $('select#'+TargetClass+index).fadeOut('slow').remove();
                        UnsignedNum = ChemDataObj.CorrectAnswerObj[index].replace("+","").replace("-","").trim();
                        console.log("GetSelectedData - UnsignedNum: " + UnsignedNum );
                        if (UnsignedNum == "1")
                            ParentObj.html('<span class="NumberFadeOut">1</span>'+ChemDataObj.CorrectAnswerObj[index].replace("1","")).hide().fadeIn("slow");
                        else 
                            ParentObj.html(ChemDataObj.CorrectAnswerObj[index]).hide().fadeIn("slow");
                    } else {
                        ErrStr += "C ";
                        ++FailedAnswerCount;
                        FailedObj[index] += 1;
                    }
                }
                OldValObj[index] = Data;
            }
            ++NumOfAnswersCount;
        });
        ++AttemptCount;

        console.log("GetSelectedData - ErrStr: " + ErrStr );
        console.log("GetSelectedData - CorrectObj: " + JSON.stringify(CorrectObj) + ", FailedObj: " + JSON.stringify(FailedObj) );
        console.log("GetSelectedData - NumOfAnswersCount: " + NumOfAnswersCount + ", AttemptCount: " + AttemptCount + ", CorrectAnswerCount: " + CorrectAnswerCount + ", FailedAnswerCount: " + FailedAnswerCount);

        ChemDataObj.NumOfCorrectAnswers += CorrectAnswerCount;
        ChemDataObj.NumOfWrongAnswers += FailedAnswerCount;
        ChemDataObj.NumOfAttempts += AttemptCount;

        TotScoreObj.TotNumOfCorrectAnswers += CorrectAnswerCount;
        TotScoreObj.TotNumOfWrongAnswers += FailedAnswerCount;
        TotScoreObj.TotNumOfAttempts += AttemptCount;

        $(".CorrectCount").text(ChemDataObj.NumOfCorrectAnswers);
        $(".FailCount").text(ChemDataObj.NumOfWrongAnswers);
        $(".AttemptCount").text(ChemDataObj.NumOfAttempts);
        // $(".ScoreCount").text(String(Math.round(10000*ChemDataObj.NumOfCorrectAnswers/(ChemDataObj.NumOfAttempts)/100)+"%"));   // Kan give over 100% i score 
        $(".ScoreCount").text(String(Math.round(10000*ChemDataObj.NumOfCorrectAnswers/(ChemDataObj.NumOfAttempts + ReturnNumOfAnswers() - 1 )/100)+"%"));  // Kan max give 100 % i score

        $(".TotCorrectCount").text(TotScoreObj.TotNumOfCorrectAnswers);
        $(".TotFailCount").text(TotScoreObj.TotNumOfWrongAnswers);
        $(".TotAttemptCount").text(TotScoreObj.TotNumOfAttempts);
        // $(".ScoreCount").text(String(Math.round(10000*ChemDataObj.NumOfCorrectAnswers/(ChemDataObj.NumOfAttempts)/100)+"%"));   // Kan give over 100% i score 
        $(".TotScoreCount").text(String(Math.round(10000*TotScoreObj.TotNumOfCorrectAnswers/(TotScoreObj.TotNumOfAttempts + ReturnTotNumOfAnswers(Delimiter) - ReturnNumOfQuestions() )/100)+"%"));  // Kan max give 100 % i score

        NumOfAnswersCount = 0;

        SetTimerAndFadeout(".NumberFadeOut", 500, 1000);
        console.log("GetSelectedData - ChemDataObj: " + JSON.stringify(ChemDataObj) );
    // });  // END .on("change")
}


function SetTimerAndFadeout(Selector, TimeTimeout, TimeFadeOut){
    TimerId = setTimeout( function(){ 
        $(Selector).fadeOut(TimeFadeOut, function() {
            $( Selector ).parent().addClass("UnityFactor");
            $( Selector ).remove();
            console.log("SetTimerAndFadeout - OK");
        });
    } , TimeTimeout);
}


function ReloadPage() {
    location.reload();
}


// This function is not in use
function SearchForDelimiterAndAddClassToParentTag(LatexStr, Delimiter, NewClass){

    var StartPos = 0; var EndPos = 0; var Val = ""; var count = 0; var StartTagPos; var EndTagPos; var StartTagStr; var ClassPos; var StartStr; var EndStr;
    var ErrStr = "";
    do {
        StartPos = LatexStr.indexOf(Delimiter, StartPos); 
        StartTagPos = LatexStr.substring(0,StartPos).lastIndexOf("<", StartPos);
        EndTagPos = LatexStr.substring(0,StartPos).lastIndexOf(">", StartPos);
        console.log("SearchForDelimiterAndAddClassToParentTag - StartPos: " + StartPos + ", StartTagPos: " + StartTagPos + ", EndTagPos: " + EndTagPos);
        StartStr = LatexStr.substring(0,StartTagPos);
        EndStr = LatexStr.substring(EndTagPos+1);
        console.log("SearchForDelimiterAndAddClassToParentTag - StartStr: " + StartStr + ", EndStr: " + EndStr);
        StartTagStr = LatexStr.substring(StartTagPos,EndTagPos+1);
        console.log("SearchForDelimiterAndAddClassToParentTag - StartTagStr: " + StartTagStr);
        ClassPos = StartTagStr.indexOf("class=");
        if (ClassPos !== -1) {
            ErrStr += "A ";
            StartTagStr = StartTagStr.substring(0, ClassPos + "class= ".length)+NewClass+" "+StartTagStr.substring(ClassPos + "class= ".length);
        } else {
            ErrStr += "B ";
            StartTagStr = StartTagStr.substring(0, StartTagStr.length-1)+' class="'+NewClass+'">'+StartTagStr.substring(EndTagPos);
        }
        LatexStr = StartStr + StartTagStr + EndStr;
        StartPos = LatexStr.indexOf(Delimiter, StartPos)+1;
        console.log("SearchForDelimiterAndAddClassToParentTag - StartPos 1: " + StartPos);
        StartPos = LatexStr.indexOf(Delimiter, StartPos);
        console.log("SearchForDelimiterAndAddClassToParentTag - StartPos 2: " + StartPos);
        ++count;
        // break;
    } while ((StartPos !== -1) &&  (count < 100));
    console.log("SearchForDelimiterAndAddClassToParentTag - ErrStr: " + ErrStr);
    return LatexStr;
}
// console.log("SearchForDelimiterAndAddClassToParentTag: " + SearchForDelimiterAndAddClassToParentTag("<br/> bla <sub>#3</sub> bla <sub>#4</sub> bla bla <br/>", "#", "MyClass") );
console.log("SearchForDelimiterAndAddClassToParentTag: " + SearchForDelimiterAndAddClassToParentTag('bla <sub class="TEST">#3</sub> bla <sub class="TEST">#4</sub> bla bla ', "#", "MyClass") );


function ReturnNumOfAnswers(){
    var Count = 0;
    for (var i in ChemDataObj.CorrectAnswerObj){
        ++Count;
    }
    return Count;
}

function ReturnNumOfQuestions(){
    var Count = 0;
    for (var i in QuizArray){
        ++Count;
    }
    return Count;
}



function ReturnTotNumOfAnswers(Delimiter){
    var Count = 0; var QuizNum;
    for (var i in QuizArray){
        QuizNum = QuizArray[i];
        Count += CountSubstring(JsonData[QuizNum].ChemEq, Delimiter);
    }
    return Count;
}


function ResetQuiz(){
    ChemDataObj = { ChemEq: null, 
                    ChemEqHtml: null, 
                    ChemEqHtmlDropDown: null,
                    ArgObj: {}, 
                    CorrectAnswerObj: {},
                    NumOfCorrectAnswers: 0,
                    NumOfWrongAnswers: 0,
                    NumOfAttempts: 0
                };

    $(".CorrectCount").text(0);
    $(".FailCount").text(0);
    $(".AttemptCount").text(0);
    $(".ScoreCount").text("0%");
}


function ShowStudentScore_OLD(Use_UserMsgBox){
    var HTML = '';  

    HTML += '<div class="ScoreWrapper">';
        HTML += '<h3 class="ScoreHeaderH3">Resultater</h3>';
        HTML += '<div>';
            HTML += '<span class="ScoreHeader left">Forsøg:</span><span class="ScoreAttempts ScoreNum right">0</span>';
            HTML += '<div class="clear"></div>';
        HTML += '</div>';
        HTML += '<div>';
            HTML += '<span class="ScoreHeader left">Korrekt:</span><span class="ScoreCorrect ScoreNum right">0</span>';
            HTML += '<div class="clear"></div>';
        HTML += '</div>';
        HTML += '<div>';
            HTML += '<span class="ScoreHeader left">Fejl:</span><span class="ScoreFail ScoreNum right">0</span>';
            HTML += '<div class="clear"></div>';
        HTML += '</div>';
        HTML += '<div>';
            HTML += '<span class="ScoreHeader left">Score:</span><span class="ScoreStat ScoreNum right">0%</span>';
            HTML += '<div class="clear"></div>';
        HTML += '</div>';
    HTML += '</div>';

    if (Use_UserMsgBox) 
        UserMsgBox("body", "Du klarede det med " + TotScoreObj.TotNumOfWrongAnswers + " fejl Se resultaterne her <br/>" + HTML);
    else
        $(".ShowStudentScore").html( HTML );

    // Update numbers:
    $(".ScoreAttempts").text( TotScoreObj.TotNumOfAttempts ); 
    $(".ScoreCorrect").text( TotScoreObj.TotNumOfCorrectAnswers );
    $(".ScoreFail").text( TotScoreObj.TotNumOfWrongAnswers );
    $(".ScoreStat").text( (TotScoreObj.TotNumOfCorrectAnswers/(TotScoreObj.TotNumOfAttempts + ReturnTotNumOfAnswers("#") - ReturnNumOfQuestions() )*100).toFixed(2) + "%" ); 

    if (Use_UserMsgBox) 
        return 0;
}


function ShowStudentScore(Use_UserMsgBox){
    var HTML = '';  

    if (Use_UserMsgBox) 
        // UserMsgBox("body", "Du klarede det med " + TotScoreObj.TotNumOfWrongAnswers + " fejl Se resultaterne her <br/>");
        UserMsgBox("body", "Flot, du har lavet "+MaxNumOfElements+" opgaver korrekt! <br/> Du havde " + TotScoreObj.NewTotNumOfWrongAnswers + ' fejl undervejs. <br/>Klik "Prøv igen" for at prøve igen med '+MaxNumOfElements+' nye opgaver.');
    else
        $(".ShowStudentScore").html( HTML );

    // Update numbers:
    $(".ScoreAttempts").text( TotScoreObj.TotNumOfAttempts ); 
    $(".ScoreCorrect").text( TotScoreObj.TotNumOfCorrectAnswers );
    $(".ScoreFail").text( TotScoreObj.TotNumOfWrongAnswers );
    $(".ScoreStat").text( (TotScoreObj.TotNumOfCorrectAnswers/(TotScoreObj.TotNumOfAttempts + ReturnTotNumOfAnswers("#") - ReturnNumOfQuestions() )*100).toFixed(2) + "%" ); 

    if (Use_UserMsgBox) 
        return 0;
}


function FadeTextToNewText(TargetSelector, NewText){
    $(TargetSelector).fadeOut(function() {
        $(this).text(NewText).fadeIn();
    });
}


// Funktionen laver en kopi af arrayet i argumentet, og blander elementerne tilfaeldigt
function ShuffelArray(ItemArray){
    var NumOfItems = ItemArray.length;
    var NewArray = ItemArray.slice();  // Copy the array...
    var Item2; var TempItem1; var TempItem2;
    for (var Item1 = 0; Item1 < NumOfItems; Item1++) {
        Item2 = Math.floor( Math.random() * NumOfItems);
        TempItem1 = NewArray[Item1];
        TempItem2 = NewArray[Item2];
        NewArray[Item2] = TempItem1;
        NewArray[Item1] = TempItem2;
    }
    return NewArray;
}


function ReturnQuizArray(JsonData){
    var QuizArray = [];
    for (var i in JsonData){
        QuizArray.push(i);
    }
    return QuizArray;
}


function ReturMaxNumOfElements(PrincipleArray, MaxNumOfElements){
    if (PrincipleArray.length > MaxNumOfElements)
        return PrincipleArray.slice(0, MaxNumOfElements);
    else
        return PrincipleArray;
}
console.log("ReturMaxNumOfElements: " + ReturMaxNumOfElements([0,1,2,3,4,5,6,7,8,9], 6) );



function GiveQuestions(JsonData){

    // $("#TaskNumber").text(Level); 

    var OriginalInstruction = $("#QuestionTask").html();

    $("#TaskNumber").html('<img class="TaskNumberImg" src="../../../library/img/TaskNumbers_'+Level+'.svg"/>');

    QuizArray = ReturnQuizArray(JsonData);
    console.log("GiveQuestions - QuizArray 1: " + QuizArray);
    QuizArray = ShuffelArray(QuizArray);
    console.log("GiveQuestions - QuizArray 2: " + QuizArray);
    QuizArray = ReturMaxNumOfElements(QuizArray, MaxNumOfElements);
    console.log("GiveQuestions - QuizArray 3: " + QuizArray);
    var QuizNum = QuizArray[QuestionNum];

    $(".QuestionCounter").html(String(QuestionNum+1)+"/"+String(QuizArray.length));
    // ChemLatexToHtml( JsonData[QuestionNum].ChemEq );
    ChemLatexToHtml( JsonData[QuizNum].ChemEq );
    $(".ChemWrap").html( ChemDataObj.ChemEqHtmlDropDown );
    $(".ChemArrowWrap").html('<img id="ChemArrow" src="../../../library/img/glyphicon_reaktionspil_black2.svg" alt="Reaktionpil" />');

    var ErrStr = "";

    $( document ).on('click', ".CheckAnswer", function(event){
        event.preventDefault();  // Prevents sending the user to "href".
        GetSelectedData("Id", "#");  // ChemWrap2

        ErrStr += "A ";

        console.log("GiveQuestions - QuestionNum: " + QuestionNum + ", ReturnNumOfQuestions: " + ReturnNumOfQuestions() );
        console.log("GiveQuestions - ChemDataObj.NumOfCorrectAnswers: " + ChemDataObj.NumOfCorrectAnswers + ", ReturnNumOfAnswers: " + ReturnNumOfAnswers() );

        if (QuestionNum < ReturnNumOfQuestions()-1){
            ErrStr += "B ";
            if ( ChemDataObj.NumOfCorrectAnswers == ReturnNumOfAnswers() ){
                // $("#UserBtn").text("Næste spørgsmål");
                FadeTextToNewText("#UserBtn", "Næste spørgsmål");
                $("#UserBtn").toggleClass("CheckAnswer NextQuestion");
                ErrStr += "C ";
                $("#QuestionTask").html("Du har afstemt reaktionen rigtigt.");
            } else {
                $("#QuestionTask").html("De valgte værdier passer ikke, prøv igen.");
            }
        } else {
            if ( ChemDataObj.NumOfCorrectAnswers == ReturnNumOfAnswers() ){
                // $("#UserBtn").text("Se din score");
                FadeTextToNewText("#UserBtn", "Se din score");
                $("#UserBtn").toggleClass("CheckAnswer CheckScore");
                ErrStr += "D ";
            }

            if ($(".CoeffNum").text().length == 0) $(".CoeffNum").remove();
        }
        console.log("GiveQuestions - ErrStr: " + ErrStr);

        if ((ChemDataObj.NumOfWrongAnswers > 0) && (TotScoreObj.MemTotNumOfWrongAnswers != ChemDataObj.NumOfWrongAnswers)) {
            TotScoreObj.NewTotNumOfWrongAnswers += 1;
            TotScoreObj.MemTotNumOfWrongAnswers = ChemDataObj.NumOfWrongAnswers;
            $(".ErrorCount").text(TotScoreObj.NewTotNumOfWrongAnswers);
        }
    });

    $( document ).on('click', ".NextQuestion", function(event){
        event.preventDefault();  // Prevents sending the user to "href".
        // $("#UserBtn").text("Check svar");
        $("#QuestionTask").html(OriginalInstruction);
        FadeTextToNewText("#UserBtn", "Tjek svar");
        $("#UserBtn").toggleClass("CheckAnswer NextQuestion");
        ErrStr += "E ";

        ResetQuiz();
        ++QuestionNum;
        console.log("GiveQuestions - QuestionNum: " + QuestionNum);
        // $(".QuestionCounter").text(String(QuestionNum+1)+"/"+String(ReturnNumOfQuestions()));
        $(".QuestionCounter").html(String(QuestionNum+1)+"/"+String(QuizArray.length));
        QuizNum = QuizArray[QuestionNum];
        ChemLatexToHtml( JsonData[QuizNum].ChemEq );
        $(".ChemWrap").html( ChemDataObj.ChemEqHtmlDropDown );
        console.log("GiveQuestions - ErrStr: " + ErrStr);
        $(".ChemArrowWrap").html('<img id="ChemArrow" src="../../../library/img/glyphicon_reaktionspil_black2.svg" alt="Reaktionpil" />');
    });

    $( document ).on('click', ".CheckScore", function(event){
        event.preventDefault();  // Prevents sending the user to "href".
        ErrStr += "F ";
        // alert("Din score!!!");
        ShowStudentScore(true);
        // $("#UserBtn").text("Prøv igen");
        FadeTextToNewText("#UserBtn", "Prøv igen");
        $("#UserBtn").toggleClass("CheckScore TryAgain");
        console.log("GiveQuestions - ErrStr: " + ErrStr);
    });

    $( document ).on('click', ".TryAgain", function(event){
        event.preventDefault();  // Prevents sending the user to "href".
        ErrStr += "G ";
        // $("#UserBtn").text("Næste spørgsmål");
        console.log("GiveQuestions - ErrStr: " + ErrStr);
        location.reload();
    });

}


// TEST URL:
// file:///Users/THAN/main-gulp-folder/objekter/kemi_drag/builds/development/index.html?var0=val0&var1=val1&amp;var2=val2%26var3=val3
function ReturnURLPerameters(){
    UlrVarObj = {};
    var UrlVarStr = window.location.search.substring(1);
    console.log("ReturnURLPerameters - UrlVarStr: " + UrlVarStr);
    var UrlVarPairArray = decodeURIComponent(UrlVarStr).split("&");  // decodeURIComponent handles %26" for the char "&" AND "%3D" for the char "=".
    console.log("ReturnURLPerameters - UrlVarPairArray: " + UrlVarPairArray);
    for (var i in UrlVarPairArray){
        var UrlVarSubPairArray = UrlVarPairArray[i].split("=");  // & = %3D
        if (UrlVarSubPairArray.length == 2){
            UlrVarObj[UrlVarSubPairArray[0]] = UrlVarSubPairArray[1];
        }
    }
    console.log("ReturnURLPerameters - UlrVarObj: " + JSON.stringify( UlrVarObj ));
    return UlrVarObj;
}



// TEST URL:
// file:///Users/THAN/main-gulp-folder/objekter/kemi_drag/builds/development/index.html?pn=1&dm=1    NOTE: 0 = false, 1 = true
// file:///Users/THAN/main-gulp-folder/objekter/kemi_drag/builds/development/index.html?pn=1&dm=0    NOTE: 0 = false, 1 = true
function SetProgramPerameter(UlrVarObj){
    if (UlrVarObj.hasOwnProperty("l") && ((1 <= parseInt(UlrVarObj["l"])) || (parseInt(UlrVarObj["l"]) <= 3))) Level = UlrVarObj["l"];  // PrincipleNum  =  pn
    console.log("SetProgramPerameter - ReturnURLPerameters - Level: " + Level ); 
}


//########################################################################
//                        Quiz data...
//########################################################################


// var JsonData = [{"ChemEq" : "Sæt de korrekte index tal på Glucose molekylet: C_{#6}H_{#12}O_{#6} ; 2:8 ; 5:14 ; 4:10"},
//                 {"ChemEq" : "Sæt ladninger på phosphat: PO_4^{#3-} og Jern(III) Fe^{#3+} ; 5-:3+ ; 3-:4+ "},
//                 {ChemEq : "H_{#2} + F_{#2} ---> #2HF; 0:3 ; 0:3 ; 0:3 "},
//                 {ChemEq : "#2Na + Cl_{#2} ---> #2NaCl; 0:3 ; 0:3 ; 0:3 "},
//                 {ChemEq : "#P + Br_{#2} ---> #PBr_2; 0:3 ; 0:3 ; 0:2 "},
//                 {ChemEq : "H_{#2} + Br_{#2} ---> #2HBr; 0:3 ; 0:3 ; 0:2 "},
//                 {ChemEq : "#ZnS + #2HCl ---> ZnCl_2 + H_2S; 0:3 ; 0:3 "},
//                 {ChemEq : "#Na_2CO_3 + #2HCl ---> #2NaCl + H_2O + CO_2; 1:5 ; 0:5; 0:4"},
//                 {ChemEq : "#PCl_5 + #4H_2O ---> H_3PO_4 + 5HCl; 1:6 ; 2:10"},
//                 {ChemEq : "#2CO + O_2 ---> 2CO_2; 0:5"},
//                 {ChemEq : "2C_4H_{10} + 13O_2 ---> #8CO_2 + #10H_2O; 5:10; 5:13"},
//                 {ChemEq : "#2Mg + O_2 ---> #2MgO; 0:3 ; 0:3 "},
//                 {ChemEq : "C_7H_{16} + 11O_2 ---> #7CO_2 + #8H_2O; 2:9; 4:11"},
//                 {ChemEq : "#Mg^{2+} + #CO_3^{2-} ---> MgCO_3; 1:6 ; 1:6"},
//                 {ChemEq : "#Mg^{2+} + 2OH^- ---> #Mg(OH)_2; 1:6 ; 1:6"},
//                 {ChemEq : "#Mg^{2+} + #S^{2-} ---> MgS;  1:3 ; 1:4"},
//                 {ChemEq : "#Zn^{2+} + #2OH^- ---> Zn(OH)_2; 0:5 ; 0:5"},
//                 {ChemEq : "#3Zn^{2+} + #2PO_4^{3-} ---> Zn_3(PO_4)_2; 1:6 ; 1:5"},
//                 {ChemEq : "#Cu^{2+} + #3I^- ---> CuI + I_2; 0:6 ; 1:5"},
//                 {ChemEq : "#Cu^{2+} + #2CO_3^{2-} ---> CuO_2 + 2CO_2; 1:5 ; 1:5"},
//                 {ChemEq : "#3Cu^{2+} + #2PO_4^{3-} ---> Cu_3(PO_4)_2; 1:5 ; 1:5"},
//                 {ChemEq : "#Fe^{2+} + #CO_3^{2-} ---> FeCO_3; 1:5 ; 1:5"},
//                 {ChemEq : "#Fe^{2+} + #2OH^- ---> Fe(OH)_2; 1:5 ; 1:5"},
//                 {ChemEq : "#2Fe^{3+} + #3CO_3^{2-} ---> Fe_2(CO_3)_3; 1:5 ; 1:5"},
//                 {ChemEq : "#Fe^{3+} + #3OH^- ---> Fe(OH)_3; 1:5 ; 1:5"},
//                 {ChemEq : "#2Fe^{3+} + #3S^{2-} ---> Fe_2S_3; 2:10 ; 1:8"},
//                 {ChemEq : "#2Ag^+ + #SO_4^{2-} ---> Ag_2SO_4; 1:5 ; 1:5"},
//                 {ChemEq : "#2Ag^+ + #CO_3^{2-} ---> Ag_2CO_3; 1:5 ; 1:5"},
//                 {ChemEq : "#2Ag^+ + #2OH^- ---> Ag_2O + H_2O; 1:6 ; 1:4"}
//                 ];



//########################################################################
//                        Run code....
//########################################################################


// $( document ).ready(function() {  // CapitalI

//     GiveQuestions(JsonData);

// });

