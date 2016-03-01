/****************************************************
* Javascript számológép          
*   v1.0 (2014.10.18) 
*   Méhész György Ákos (Booboo)
* 
****************************************************/
function elem(tag, args){
  var node = document.createElement(tag);
  if (args){
    if (args.h){
      node.innerHTML=args.h;
    }
    if (args.a){
      for (var a in args.a)
        node.setAttribute(a, args.a[a]);
    }
    if (args.s){
      for (var s in args.s)
        node.style[s] = args.s[s];
    }
    if (args.p){
      (typeof args.p == "string" ? document.getElementById(args.p) : args.p).appendChild(node);
    }
  }  
  return node;
}

var calc = {
  /** Megjelenítéshez **/
  floatpointTxt: ",",
  numGroupSeparator: " ",
  
  /******************
  *  Tulajdonságok  *
  ******************/
   
  _screen: "0",
  _scrNode: null,
  numStack: [],
  opStack: [],
  mem: 0,
  activOp: false, // valamilyen művelet közben vagyunk
  eq: false,
  
  get screen() { // Ezres helyiérték mentén tagolva adja vissza megjelenítendő számot.
  
    var numberParts = this._screen.split("."), // Egész rész / tört rész
        pcs = parseInt((numberParts[0].replace("-", "").length-1)/3), // Előjelet nem számítva az ezres csoportok száma. :)
        returnText = numberParts[0].substr(0, numberParts[0].length - pcs * 3); // Az előjel + a maradék számok
        
    for (var i = pcs; i > 0; i--){
      returnText += this.numGroupSeparator + numberParts[0].substr(-3 * i, 3);
    }
    
    if (this._screen.indexOf(".") > -1)
      returnText += this.floatpointTxt + ((numberParts[1]) ? numberParts[1] : "");
    return returnText;
  },
  
  /**************
  *  Metódusok  *
  **************/
  
  /* evaluate */
  evl: function(){
    function isOpLow(op){
      return (op == "×" || op == "÷") ? false : true;
    }
    
    while (this.opStack.length > 1 && (isOpLow(this.opStack[this.opStack.length-1]) || isOpLow(this.opStack[this.opStack.length-1]) == isOpLow(this.opStack[this.opStack.length-2]))){
      var lastOp = this.opStack.pop(),
      num2 = this.numStack.pop(),
      num1 = this.numStack.pop(),
      sum;
      
      switch (this.opStack.pop()){
        case "×":
        sum = num1 * num2;
        break;
        
        case "÷":
        sum = num1 / num2;
        break;
        
        case "+":
        sum = num1 + num2;
        break;
        
        case "-":
        sum = num1 - num2;
        break;
      }
      
      this.numStack.push(sum);
      if (lastOp != "=" || this.opStack.length > 0)
        this.opStack.push(lastOp);
    }
  },
  
  /* numbers */
  numbers: function(value) { // Ellenőrzi és beállítja az új számot.
    if (this.activOp || this.eq){
      this._screen = "0";
      this.activOp = false;
      this.eq = false;
      
      /** verem vizsgálat **/
      this.evl();
    } 
    
    /** az új karakter hozzáfűzése **/
    if (value == "dot"){ // Tizedes pont, pont vesszőcske?
      if (this._screen.indexOf(".") == -1)
        this._screen += ".";
    }
    else { // Szám gomb...
      var numberParts = this._screen.split(".");
      if ((numberParts[1] && numberParts[1].length > 6) || this._screen.replace("-", "").length > 14){ // Ha a mérethatárokon kívül esne.
        return false;
      }
      if (this._screen == "0"){
        this._screen = String(value);
      }
      else {
        this._screen += String(value);
      }          
    }
    
    this._scrNode.textContent = this.screen;        
  },
  
  /* op */
  op: function(op){
    var ops = {add: "+", sub: "-", mul: "×", div: "÷", summ: "="},
        num = parseFloat(this._screen);
    
    if (ops[op] == "="){
      this.numStack.push(num);
      this.eq = true;
      if (this.numStack.length > 1){
        this.opStack.push("=");
        this.evl();
      }
      this._screen = this.arithmeticCheck(this.numStack.pop());
      this._scrNode.textContent = this.screen;
      this.activOp = false;
      return;
      
    } else if (this.activOp){
      this.opStack[this.opStack.length-1] = ops[op];
    } else {
      this.numStack.push(num);
      this.opStack.push(ops[op]);
    }
    
    this.activOp = true;    
  },
  
  /* specOp */
  specOp: function(op){
    switch (op){
      case "del":
        this._screen = (this._screen.replace("-", "").length > 1) ? this._screen.substr(0, this._screen.length -1) : "0";
        break;
      
      case "chg":
        this._screen = this.arithmeticCheck(this._screen * -1);
        break;
        
      case "percent":
        this._screen = this.arithmeticCheck(this._screen / 100);
        break;
        
      case "pi":
        this._screen = String(Math.PI.toPrecision(8));
        break;
        
      case "ran":
        this._screen = String(Math.random().toPrecision(3));
        break;
        
      case "rnd":
        this._screen = String(Math.round(this._screen));
        break;
        
      case "rec":
        this._screen = this.arithmeticCheck(1/this._screen);
        break;
        
      case "Min":
        this.mem = parseFloat(this._screen);
        break;
        
      case "Mrc":
        this._screen = String(this.mem);
        break;
        
      case "Mplus":
        this.mem += parseFloat(this._screen);
        break;
        
      case "Mminus":
        this.mem -= parseFloat(this._screen);
        break;
    }
    this._scrNode.textContent = this.screen;
  },
  
  /* arithmeticCheck */
  arithmeticCheck: function(result){ // Aritmetikai hibák kozmetikázására. :)
    var ret = String(parseFloat(result).toPrecision(15)).replace(/0*(e-?\d+)?$/, "$1");
    return (/-?\d+\.\s*e\s*[+-]?\d+|\.$/.test(ret)) ? ret.replace(".", "") : ret;
  },
  
  /* click */
  click: function(e){
    var id = e.target.id,
    buttonName = id.substring(1);
    
    switch (id[0]) {
      case "F":
        if (buttonName == "clearAll")
          this.init();
        else
          this.specOp(buttonName);
        break;
      
      case "O":
        this.op(buttonName);
        break;
      
      case "N":
        this.numbers(buttonName);
        break;
    }
  },
  
  /* init */
  init: function (cont_id){ // cont_id => a számológép konténere 
    this._screen = "0";
    this.numStack = [];
    this.opStack = [];
    this.activOp = false;
    this.eq = false;
    
    if (cont_id){
      this._scrNode = document.getElementById("screen");
      document.getElementById(cont_id).addEventListener("click",
        function(){
          return function(e){
            calc.click(e);
          }
        }()
      );
      
      for (var i = 3; i > 0; i--){
        var row = elem("div", {s:{clear: "both"}, p: "numContainer"});
        for (var x = 2;x >= 0; x--){
          elem("button", {a:{class: "numbers", id: "N"+(i*3-x)}, h: i*3-x, p:row});
        }
      }
      row = elem("div", {s:{clear: "both"}, p: "numContainer"});
      elem("button", {a:{class: "numbers", id: "N0"}, h: "0", p:row});
      elem("button", {a:{class: "numbers", id: "Ndot"}, h: this.floatpointTxt, p:row});
      elem("button", {a:{class: "numbers", id: "Fchg"}, h: "±", p:row});
      
      var buttons = {
        Fdel: "Del",
        FclearAll: "AC",
        Omul: "×",
        Odiv: "÷",
        Oadd: "+",
        Osub: "-",
        Osumm: "=",
        Fpercent: "%"
      };
      
      x = 0;
      for (i in buttons){
        if (!x){
          row = elem("div", {s:{"clear": "both"}, p: "opContainer"});
          x = 2;
        }
        elem("button", {a:{class: "ops", id:i}, h: buttons[i], p: row});
        x--;
      }
      
      var specOpCont = document.getElementById("specOpContainer");
      if (specOpCont){
        var buttons = {
          newline1:"",
          Fpi: "pi",
          Fran: "Ran#",
          Frnd: "Rnd",
          Frec: "1/x",
          newline2: "",
          FMin: "Min",
          FMrc: "MR",
          FMplus: "M+",
          FMminus: "M-"
        }
        
        for (i in buttons){
          if (i.indexOf("newline") >-1)
            row = elem("div", {s:{clear: "both"}, p: specOpCont});
          else
            elem("button", {a:{id:i}, h: buttons[i], p: row});
        }
        specOpCont.style.display = "block";
      }
    }
    
    this._scrNode.textContent = this.screen;
  }
}