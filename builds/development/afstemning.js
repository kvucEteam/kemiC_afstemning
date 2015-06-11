

//###############################################################################################
//                       Utility functions 
//###############################################################################################


function CountSubstring(str, subStr){  // http://rosettacode.org/wiki/Count_occurrences_of_a_substring#JavaScript
    return str.match(new RegExp(subStr, "g")).length;
}



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



function LatexEnclosedPramToHtml(LatexStr, Delimiter){

    var StartPos = 0; var EndPos = 0; var Val = ""; var count = 0;
    do {
        StartPos = LatexStr.indexOf(Delimiter+"{", EndPos); 
        if (StartPos !== -1){
            EndPos = LatexStr.indexOf("}", StartPos+2);
            if (EndPos !== -1){
                Val = LatexStr.substring(StartPos+2, EndPos);
                LatexStr = LatexStr.substring(0,StartPos) + ((Delimiter == "^")?'<sup>'+Val+'</sup>':'<sub>'+Val+'</sub>') + LatexStr.substring(EndPos+1);
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
            LatexStr = LatexStr.substring(0,StartPos) + ((Delimiter == "^")?'<sup>'+Val+'</sup>':'<sub>'+Val+'</sub>') + LatexStr.substring(StartPos+2);
        }
        ++count;
    } while ((StartPos !== -1) &&  (count < 100));

    return LatexStr;
}


function LatexCoeffToHtml(LatexStr){
    var CoeffArray = LatexStr.match(/((\ \d+)|^\d)/g); 
    var StartPos = 0;
    for (var i in CoeffArray){
        StartPos = LatexStr.indexOf(CoeffArray[i], StartPos);
        if (StartPos !== -1){
            if (StartPos == 0){
                LatexStr = "<span class='Coeff'>"+LatexStr.substring(0,CoeffArray[i].length)+"</span>"+LatexStr.substring(CoeffArray[i].length);
            } else {
                LatexStr = LatexStr.substring(0,StartPos)+" <span class='Coeff'>"+CoeffArray[i].replace(" ", "")+"</span>"+LatexStr.substring(StartPos+CoeffArray[i].length);
            }
        }
    }
    return LatexStr;
}
console.log("LatexCoeffToHtml: " + LatexCoeffToHtml("1A + 2B + 3C + 4D + 5E + 331K") );


function SplitChemEqIntoReactantsAndProducts(LatexStr, Delimiter){
    var ChemEq = LatexStr.split(Delimiter);
    var HTML = "";
    for (var i in ChemEq){
        HTML +='<span class="'+((i==0)?'Reactants':'Products')+'">'+ChemEq[i]+'</span>'+((i==0)?'<span class="ChemArrow">'+Delimiter+'</span>':'');
    }
    console.log("SplitChemEqIntoReactantsAndProducts - HTML: " + HTML ); 
    return HTML;
}



function ChemLatexToHtml(LatexStr){

    // IMPORTANT NOTE: LatexEnclosedPramToHtml() has to be called before LatexPramToHtml() because of delimiters "_{" and "^{" contains the "{" start-bracket.
    LatexStr = LatexEnclosedPramToHtml(LatexStr, "_");  
    LatexStr = LatexEnclosedPramToHtml(LatexStr, "^");
    LatexStr = LatexPramToHtml(LatexStr, "_");
    LatexStr = LatexPramToHtml(LatexStr, "^");
    LatexStr = LatexCoeffToHtml(LatexStr);
    LatexStr = SplitChemEqIntoReactantsAndProducts(LatexStr, "--->");

    return LatexStr;
}
console.log("ChemLatexToHtml 1: " + ChemLatexToHtml("Fe_{2}(SO_{4})_{3} + H_{2}O ----> 2Fe^{3+} + 3SO_{4}^{2+}") );



//###############################################################################################
//                              Inset funktionality to ChemHtml
//###############################################################################################


function AddDropdownToSelectorTag(ParentContainer, SelectorTag){
    var Val = $(ParentContainer+" "+ SelectorTag).text();
    var HTML = "";
    var Sign = "";
    var NumStr = "";
    $(ParentContainer+" "+ SelectorTag).each(function( index, element ) {
        Val = $(element).text();
        Sign = (($(element).text().indexOf("+")!==-1)?"+":"")+(($(element).text().indexOf("-")!==-1)?"-":"");
        console.log("AddDropdownToSelectorTag - Val: " + Val + ", Val.indexOf('('): " + Val.indexOf("(")  + ", Val.indexOf(')'): " + Val.indexOf(")"));
        if ((Val.indexOf("(") === -1) || (Val.indexOf(")") === -1)) {
            HTML = '<select id="'+SelectorTag+index+'">';
            for (var i = 0; i < 10; i++) {
                NumStr = (i != 0) ? i+Sign : i;
                HTML += '<option value="'+NumStr+'">'+NumStr+'</option>';
            };
            HTML += '</select>';
        } else {
            HTML = Val;
        }
        $(element).html(HTML);
    });
}


//###############################################################################################
//                              Test area
//###############################################################################################



var ChemStr1 = "Fe_2(SO_4)_3_{(s)} ---> 2Fe^{3+}_{(aq)} + 3SO_4^{2-}_{(aq)}";
var ChemStr2 = "C_5H_{12} + 8O_2 ---> 7CO_2 + 8H_2O";
var ChemStr3 = "1BAa_1^+ + 2C_2Dd_3^{4+} + 3C_2Dd_3^{4-} ---> 1BAa_1^+ + 2C_2Dd_3^{4+} + 3C_2Dd_3^{4-}";

var LatexStr = ChemStr3;   // ChemLatexToHtml2() har fejl ved: ChemStr10, ChemStr12, ChemStr13



//########################################################################
//                        Run code....
//########################################################################


$( document ).ready(function() {  // CapitalI

    $(".ChemWrap0").html( LatexStr );
    $(".ChemWrap1, .ChemWrap2, .ChemWrap3, .ChemWrap4").html( ChemLatexToHtml( LatexStr ) );
    

    // AddDropdownToSelectorTag(".ChemWrap2 .Reactants", "span.Coeff");
    // AddDropdownToSelectorTag(".ChemWrap3 .Reactants", "sub");
    // AddDropdownToSelectorTag(".ChemWrap4 .Reactants", "sup");

    AddDropdownToSelectorTag(".ChemWrap2 .Products", "span.Coeff");
    AddDropdownToSelectorTag(".ChemWrap3 .Products", "sub");
    AddDropdownToSelectorTag(".ChemWrap4 .Products", "sup");
   

});

