let register = {
    ah: "00000000",
    al: "00000000",
    bh: "00000000",
    bl: "00000000",
    ch: "00000000",
    cl: "00000000",
    dh: "00000000",
    dl: "00000000",
};
let cycles = {
  fetch:false,
  decode:false,
  execute:false,
  store:false,
  load:false,
}
let reg_code = {
  al: "000",
  ah: "001",
  bl: "010",
  bh: "011",
  cl: "100",
  ch: "101",
  dl: "110",
  dh: "111",
}

let memory = ['00000000','00000000','00000000','00000000','00000000','00000000','00000000','00000000','00000000','00000000','00000000','00000000','00000000','00000000','00000000','00000000'];

function convertNum(val){
  return parseInt(val, 2);
}

function cycles_color(color){
  if(cycles.fetch==true){
      document.getElementById("fetch").style.backgroundColor = color;
  }
  if(cycles.decode==true){
    document.getElementById("decode").style.backgroundColor = color;
  }
  if(cycles.load==true){
    document.getElementById("load").style.backgroundColor = color;
  }
  if(cycles.execute==true){
    document.getElementById("execute").style.backgroundColor = color;
  }
  if(cycles.store==true){
    document.getElementById("store").style.backgroundColor = color;
  }
}

function get_regcode(reg){
  return reg_code[reg];
}

function deci_bin(num){
  let bin_num = (num>>>0).toString(2);
  if (bin_num.length > 8){
    bin_num = bin_num.split('').reverse();
    bin_num = bin_num.join('').substring(0,8);
    bin_num = bin_num.split('').reverse().join('');
}
else if(bin_num.length < 8){
    let num_zero = 8-bin_num.length; 
    for(let x = 0; x< num_zero; x++)
    {
        bin_num = "0" + bin_num;  
    }
}
return bin_num;
}

function identify(exp){
    if (exp[0] == '[' && exp[exp.length -1] == ']'){
        if(exp.includes('+')){
            return "rmemloc";
        }
        else if (exp[exp.length -2] != 'h' && exp[exp.length -2] != 'l' && exp[exp.length -2] != 'x'){
            return "dirmemloc";
        }
        else {
            return "memloc";
        }
    } 
    else{
        if (exp[exp.length -1] != 'h' && exp[exp.length -1] != 'l' && exp[exp.length -1] != 'x'){
            return "imm";
        }
        else{
            return "reg";
        }
    }
}

function flag_get(des, src){
    let y = identify(des) + '_' + identify(src);
   /* legit time waster, cuz lots of permutations/combinations for memloc & co
    if (y == "memloc_memloc" || y == "memloc_dirmemloc" || y == "memloc_rmemlo")
    */
    return y;
}

function add(desval,srcval){  
  desval = parseInt(desval,2);
  srcval =  parseInt(srcval,2);
  desval += srcval;
  desval = desval.toString(2);
  if (desval.length > 8){
      desval = desval.split('').reverse();
      desval = desval.join('').substring(0,8);
      desval = desval.split('').reverse().join('');
  }
  else if(desval.length < 8){
      let num_zero = 8-desval.length; 
      for(let x = 0; x< num_zero; x++)
      {
          desval = "0" + desval;  
      }
  }
  return desval;
}

function mov(des, src) { 
  cycles.fetch = false;
  cycles.decode = false;
  cycles.execute = false;
  cycles.store = false;
  let index;
  let reg_used;
  let desreg_code;
  let srcreg_code;
  let address;
  switch (flag_get(des, src)) {
    case "reg_reg":
      register[des] = register[src];
      cycles.fetch  =true;
      cycles.decode=true;
      cycles.execute=true;
      desreg_code = get_regcode(des);
      srcreg_code = get_regcode(src);
      return "1000100011" + desreg_code + srcreg_code;

    case "reg_memloc":
      reg_used = src.substring(1, 3);
      index = parseInt(register[reg_used], 2);
      if (index >= 0 && index < 16) {
        register[des] = memory[index];
      }// else statement to say large index
      cycles.fetch  =true;
      cycles.decode=true;
      cycles.load=true;
      desreg_code = get_regcode(des);
      return "1000101000" + desreg_code + "110";

    case "reg_dirmemloc":
      if (src[src.length -2] == 'b'){
          index = parseInt(src.substring(1,(src.length) - 2),2);
      }
      else{
          index = Number(src.substring(1,src.length-1));
      }
      if (index >= 0 && index < 16) {
        register[des] = memory[index];
      }// else statement to say large index
      cycles.fetch  =true;
      cycles.decode=true;
      cycles.load=true;
      desreg_code = get_regcode(des);
      return "1000101000" + desreg_code + "110";

    case "reg_imm":
     let src_val;
     if (src[src.length -1] == 'b'){
      src_val = src.substring(0,src.length-1);
      }
     else{
      src_val = deci_bin(src);
      }
     if(src_val.length <= 8){  
          let num_zero = 8-src_val.length; 
          for(let x = 0; x< num_zero; x++){
              src_val = "0" + src_val;  
          }
          register[des] = src_val;
      }
      else{
          return "invalid instruction operand(s)"
      }
      desreg_code = get_regcode(des);
      return "100010xxxx" + desreg_code + "xxx" + src_val;

    case "memloc_reg":
      reg_used = des.substring(1, 3);
      index = parseInt(register[reg_used], 2);
      if (index >= 0 && index < 16) {
        memory[index] = register[src];
      }// else statement to say large index
      cycles.fetch  =true;
      cycles.decode=true;
      cycles.store=true;
      srcreg_code = get_regcode(src);
      address = register[reg_used];
      return "1000100000" + srcreg_code + "110" + address;

    case "dirmemloc_reg":
      if (des[des.length -2] == 'b'){
          index = parseInt(des.substring(1,(des.length) - 2),2);
      }
      else{
          index = Number(des.substring(1,des.length-1));
      }
      if (index >= 0 && index < 16) {
       memory[index] =  register[src];
      }// else statement to say large index
      cycles.fetch  =true;
      cycles.decode=true;
      cycles.store=true;
      srcreg_code = get_regcode(src);
      address = index.toString(2);
      return "1000100000" + srcreg_code + "110" + address;
  }
}

  
function add_ins(des,src){
  let des_val;
  let src_val;
  let index;
  let reg_used;
  let desreg_code;
  let srcreg_code;
  cycles.fetch = false;
  cycles.decode = false;
  cycles.execute = false;
  cycles.store = false;
switch (flag_get(des, src)) {
  case "reg_reg":
    des_val = register[des];
    src_val = register[src];
    register[des] = add(des_val,src_val);
    desreg_code = get_regcode(des);
    srcreg_code = get_regcode(src);
    return "00000000" + desreg_code + srcreg_code;

  case "reg_memloc":
    des_val = register[des];
    reg_used = src.substring(1, 3);
    index = parseInt(register[reg_used], 2);
    if (index >= 0 && index < 16)
     {
        src_val = memory[index];   
        register[des] = add(des_val,src_val);
     }
    desreg_code = get_regcode(des);
    return "00000010" + desreg_code + "110";

  case "reg_dirmemloc":
    des_val = register[des];
    index;
    if (src[src.length -2] == 'b'){
        index = parseInt(src.substring(1,(src.length) - 2),2);
    }
    else{
        index = Number(src.substring(1,src.length-1));
    }
    if (index >= 0 && index < 16) {
        src_val = memory[index];
        register[des] = add(des_val,src_val);
    }// else statement to say large val
    desreg_code = get_regcode(des);
    return "0000001000" + desreg_code + "110"
    
  case "reg_imm":
    des_val = register[des];
    if (src[src.length -1] == 'b'){
        src_val = src.substring(0,src.length-1);
    }
    else{
        src_val = deci_bin(src);
    }
    register[des] = add(des_val,src_val);
    desreg_code = get_regcode(des);
    return "000000xxxx" + desreg_code + "xxx" + src_val;

  case "memloc_reg":
    src_val = register[src];
    des_val;
    reg_used = des.substring(1, 3);
    index = parseInt(register[reg_used], 2);
    if (index >= 0 && index < 16)
     {
        des_val = memory[index];   
        memory[index] = add(des_val,src_val);
     }
     srcreg_code = get_regcode(src);
     address = register[reg_used];
     return "0000000000" + srcreg_code + "110" + address;


  case "dirmemloc_reg":
    des_val;
    index;
    src_val = register[src];
    if (des[des.length -2] == 'b'){
        index = parseInt(des.substring(1,(des.length) - 2),2);
    }
    else{
        index = Number(des.substring(1,des.length-1));
    }
    if (index >= 0 && index < 16) {
        des_val = memory[index];
        memory[index] = add(des_val,src_val);
    }// else statement to say large val
    srcreg_code = get_regcode(src);
    address = index.toString(2);
    return "0000000000" + srcreg_code + "110" + address;
    
  case "reg_rmemloc":
    break;  
  case "rmemloc_reg":
    break;
  case "rmemloc_imm":
    break;
    
  case "memloc_imm":
    src_val;
    if (src[src.length -1] == 'b'){
        src_val = src.substring(0,src.length-1);
    }
    else{
        src_val = deci_bin(src);
    }
    des_val;
    reg_used = des.substring(1, 3);
    index = parseInt(register[reg_used], 2);
    if (index >= 0 && index < 16)
     {
        des_val = memory[index];   
        memory[index] = add(des_val,src_val);
     }
    break;
    
  case "dirmemloc_imm":
    if (src[src.length -1] == 'b'){
        src_val = src.substring(0,src.length-1);
    }
    else{
        src_val = deci_bin(src);
    }
    if (des[des.length -2] == 'b'){
        index = parseInt(des.substring(1,(des.length) - 2),2);
    }
    else{
        index = Number(des.substring(1,des.length-1));
    }
    if (index >= 0 && index < 16) {
        des_val = memory[index];
        memory[index] = add(des_val,src_val);32
    }// else statement to say large val
    address = index.toString(2);
    return "0000000000xxx110" + address + src_val.toString(2);    
}
}

function sub(des,src){
  let des_val;
  let src_val;
  let index;
  let reg_used;
switch (flag_get(des, src)) {
  case "reg_reg":
    des_val = register[des];
    src_val = register[src];
    register[des] = add(des_val,src_val);
    break;

  case "reg_memloc":
    des_val = register[des];
    reg_used = src.substring(1, 3);
    index = parseInt(register[reg_used], 2);
    if (index >= 0 && index < 16)
     {
        src_val = memory[index];   
        register[des] = add(des_val,src_val);
     }
    break;

  case "reg_dirmemloc":
    des_val = register[des];
    index;
    if (src[src.length -2] == 'b'){
        index = parseInt(src.substring(1,(src.length) - 2),2);
    }
    else{
        index = Number(src.substring(1,src.length-1));
    }
    if (index >= 0 && index < 16) {
        src_val = memory[index];
        register[des] = add(des_val,src_val);
    }// else statement to say large val
    break;
    
  case "reg_imm":
    des_val = register[des];
    if (src[src.length -1] == 'b'){
        src_val = src.substring(0,src.length-1);
    }
    else{
        src_val = deci_bin(src);
    }
    register[des] = add(des_val,src_val);
    break;

  case "memloc_reg":
    src_val = register[src];
    des_val;
    reg_used = des.substring(1, 3);
    index = parseInt(register[reg_used], 2);
    if (index >= 0 && index < 16)
     {
        des_val = memory[index];   
        memory[index] = add(des_val,src_val);
     }
    break;

  case "dirmemloc_reg":
    des_val;
    index;
    src_val = register[src];
    if (des[des.length -2] == 'b'){
        index = parseInt(des.substring(1,(des.length) - 2),2);
    }
    else{
        index = Number(des.substring(1,des.length-1));
    }
    if (index >= 0 && index < 16) {
        des_val = memory[index];
        memory[index] = add(des_val,src_val);
    }// else statement to say large val
    break;
    
  case "reg_rmemloc":
    break;  
  case "rmemloc_reg":
    break;
  case "rmemloc_imm":
    break;
    
  case "memloc_imm":
    src_val;
    if (src[src.length -1] == 'b'){
        src_val = src.substring(0,src.length-1);
    }
    else{
        src_val = deci_bin(src);
    }
    des_val;
    reg_used = des.substring(1, 3);
    index = parseInt(register[reg_used], 2);
    if (index >= 0 && index < 16)
     {
        des_val = memory[index];   
        memory[index] = add(des_val,src_val);
     }
    break;
    
  case "dirmemloc_imm":
    if (src[src.length -1] == 'b'){
        src_val = src.substring(0,src.length-1);
    }
    else{
        src_val = deci_bin(src);
    }
    if (des[des.length -2] == 'b'){
        index = parseInt(des.substring(1,(des.length) - 2),2);
    }
    else{
        index = Number(des.substring(1,des.length-1));
    }
    if (index >= 0 && index < 16) {
        des_val = memory[index];
        memory[index] = add(des_val,src_val);
    }// else statement to say large val
    
    break;   
}
}

// driver code
function driverfun(){
    let uinpt = document.getElementById("instruction").value;
  uinpt = uinpt.toString();
  console.log(uinpt);
  uinpt = uinpt.trim(); // removing whitespace from both sides of input
  let inp_arr;
  let temp1 = uinpt.substring(uinpt.indexOf('['), uinpt.indexOf(']')+1);
  let temp2 = uinpt.substring(0, uinpt.indexOf('['));
  let temp3;
  if (uinpt.indexOf(']') != uinpt.length -1){
    temp3 = uinpt.substring(uinpt.indexOf(']')+1);
  }
  else{
    temp3 = "";
  }
  for (i = uinpt.indexOf('['); i < uinpt.indexOf(']')+1; i++)
    {
        temp1 = temp1.replace(" ", ""); 
    }
  uinpt = temp2 + " " + temp1 + " " + temp3;
  uinpt = uinpt.trim(); // if any white spaces padded in above line
  inp_arr = uinpt.split(/(?:,| )+/);
  
  switch(inp_arr[0]){
    case "mov":
      document.getElementById("mcode").innerText = mov(inp_arr[1],inp_arr[2]);
      break;
    case "add":
      document.getElementById("mcode").innerText = add_ins(inp_arr[1],inp_arr[2]);
      break;
    case "sub":
      document.getElementById("mcode").innerText = sub(inp_arr[1],inp_arr[2]);
      break;
    case "dec":
      document.getElementById("mcode").innerText = dec(inp_arr[1]);
      break;
    case "inc":
      document.getElementById("mcode").innerText = inc(inp_arr[1]);
      break;
    case "not":
      document.getElementById("mcode").innerText = not(inp_arr[1]);
      break;
    case "and":
      document.getElementById("mcode").innerText = and(inp_arr[1],inp_arr[2]);
      break;
    case "or":
      document.getElementById("mcode").innerText = or(inp_arr[1],inp_arr[2]);
      break;
    case "neg":
      document.getElementById("mcode").innerText = neg(inp_arr[1]);
      break;
    case "xor":
      document.getElementById("mcode").innerText = xor(inp_arr[1],inp_arr[2]);
      break;
  }
  document.getElementById("ah").innerHTML = register["ah"];
  document.getElementById("al").innerHTML = register["al"];
  document.getElementById("bl").innerHTML = register["bl"];
  document.getElementById("bh").innerHTML = register["bh"];
  document.getElementById("cl").innerHTML = register["cl"];
  document.getElementById("ch").innerHTML = register["ch"];
  document.getElementById("dl").innerHTML = register["dl"];
  document.getElementById("dh").innerHTML = register["dh"];

  document.getElementById("1").innerHTML =  memory[0];
  document.getElementById("2").innerHTML =  memory[1];
  document.getElementById("3").innerHTML =  memory[2];
  document.getElementById("4").innerHTML =  memory[3];
  document.getElementById("5").innerHTML =  memory[4];
  document.getElementById("6").innerHTML =  memory[5];
  document.getElementById("7").innerHTML =  memory[6];
  document.getElementById("8").innerHTML =  memory[7];
  document.getElementById("9").innerHTML =  memory[8];
  document.getElementById("10").innerHTML = memory[9];
  document.getElementById("11").innerHTML = memory[10];
  document.getElementById("12").innerHTML = memory[11];
  document.getElementById("13").innerHTML = memory[12];
  document.getElementById("14").innerHTML = memory[13];
  document.getElementById("15").innerHTML = memory[14];
  document.getElementById("16").innerHTML = memory[15];

  console.log(cycles.decode);
  console.log(cycles.fetch);
  console.log(cycles.load);
  console.log(cycles.store);
  console.log(cycles.execute);
  cycles_color("#3791b7");
  
}
  
  

// hunaina's code:-

function inc(arg) {

  let type = identify(arg);
  cycles.fetch = false;
  cycles.decode = false;
  cycles.load = false;
  cycles.execute = false;
  cycles.store = false;
  if (type == "rmemloc") { // for [ax+b] type
    let reg = arg.substring(1, arg.indexOf("+"));
    let mshift = arg.substring(arg.indexOf("+") + 1, arg.length - 1);
    let val1 = register[reg];
    if (mshift[mshift.length - 1] == "b") {
      let val = mshift.substring(0, mshift.length - 1);
      var mem = convertNum(val) + convertNum(val1);
    }
    else if (mshift[mshift.length - 1] == "h") {
      let val = mshift.substring(0, mshift.length - 1);
      var mem = parseInt(val, 16) + convertNum(val1);
    }
    else {
      var mem = mshift + convertNum(val1);
    }
    if (mem >= 0 && mem < 16) {
      memory[mem] = deci_bin(convertNum(memory[mem]) + 1);//incremented
      cycles.fetch = true;
      cycles.decode = true;
      cycles.execute = true;
    }
  }

  else if (type == "memloc") { //for [ax] type
    let reg = arg.substring(1, arg.length - 1);
    let mem = convertNum(register[reg]);
    if (mem >= 0 && mem < 16) {
      memory[mem] = deci_bin(convertNum(memory[mem]) + 1); //incremented
      cycles.fetch = true;
      cycles.decode = true;
      cycles.execute = true;
      return "111111" + "0" + "0" + "00" + "110";
    }
  }

  else if (type == "dirmemloc") { //for [101b] types
    let val = arg.substring(1, arg.length - 1);
    if (val[val.length - 1] == "b") {
      let val1 = val.substring(0, val.length - 1);
      var mem = convertNum(val1);
    }
    else if (val[val.length - 1] == "h") {
      let val1 = val.substring(0, val.length - 1);
      var mem = parseInt(val1, 16);
    }
    else {
      var mem = val;
    }
    if (mem >= 0 && mem < 16) {
      memory[mem] = deci_bin(convertNum(memory[mem]) + 1); //incremented
      cycles.fetch = true;
      cycles.decode = true;
      cycles.execute = true;
      address = mem.toString(2);
      return "111111" + "0" + "0" + "00" + "101" + address;
    }
  }

  else if (type == "reg") {
    let val = convertNum(register[arg]);
    val = val + 1;//incremented
    register[arg] = deci_bin(val);
    cycles.fetch = true;
    cycles.decode = true;
    cycles.execute = true;
    return "111111" + "0" + "1" + "11" + get_regcode(arg);
  }

  else {
    return invalid;
  }
}


function dec(arg) {
  let type = identify(arg);
  cycles.fetch = false;
  cycles.decode = false;
  cycles.load = false;
  cycles.execute = false;
  cycles.store = false;
  if (type == "rmemloc") { // for [ax+b] type
    let reg = arg.substring(1, arg.indexOf("+"));
    let mshift = arg.substring(arg.indexOf("+") + 1, arg.length - 1);
    let val1 = register[reg];
    if (mshift[mshift.length - 1] == "b") {
      let val = mshift.substring(0, mshift.length - 1);
      var mem = convertNum(val) + convertNum(val1);
    }
    else if (mshift[mshift.length - 1] == "h") {
      let val = mshift.substring(0, mshift.length - 1);
      var mem = parseInt(val, 16) + convertNum(val1);
    }
    else {
      var mem = mshift + convertNum(val1);
    }
    if (mem >= 0 && mem < 16) {
      memory[mem] = deci_bin(convertNum(memory[mem]) - 1);//decremented
      cycles.fetch = true;
      cycles.decode = true;
      cycles.execute = true;
    }
  }

  else if (type == "memloc") { //for [ax] type
    let reg = arg.substring(1, arg.length - 1);
    let mem = convertNum(register[reg]);
    if (mem >= 0 && mem < 16) {
      memory[mem] = deci_bin(convertNum(memory[mem]) - 1); //decremented
      cycles.fetch = true;
      cycles.decode = true;
      cycles.execute = true;
      return "111111" + "0" + "0" + "00" + "110";
    }
  }

  else if (type == "dirmemloc") { //for [101b] types
    let val = arg.substring(1, arg.length - 1);
    if (val[val.length - 1] == "b") {
      let val1 = val.substring(0, val.length - 1);
      var mem = convertNum(val1);
    }
    else if (val[val.length - 1] == "h") {
      let val1 = val.substring(0, arg.length - 1);
      var mem = parseInt(val1, 16);
    }
    else {
      var mem = val;
    }
    if (mem >= 0 && mem < 16) {
      memory[mem] = deci_bin(convertNum(memory[mem]) - 1); //decremented
      cycles.fetch = true;
      cycles.decode = true;
      cycles.execute = true;
      let address = mem.toString(2);
      return "111111" + "0" + "0" + "00" + "101" + address;
    }
  }
  else if (type == "reg") {
    let val = convertNum(register[arg]);
    val = val - 1;//decremented
    register[arg] = deci_bin(val);
    cycles.fetch = true;
    cycles.decode = true;
    cycles.execute = true;
    return "111111" + "0" + "1" + "11" + get_regcode(arg);
  }
  else {
    return invalid;
  }
}

function neg(arg) {
  cycles.fetch = false;
  cycles.decode = false;
  cycles.load = false;
  cycles.execute = false;
  cycles.store = false;
  var type = identify(arg);
  if (type == "reg") {
    var x = convertNum(register[arg]);
    x = x * -1;
    register[arg] = deci_bin(x);
    cycles.fetch = true;
    cycles.decode = true;
    cycles.execute = true;
    return "111101" + "0" + "1" + "11" + get_regcode(arg);
  }
  else if (type == "memloc") {
    var x = arg.substring(1, arg.length - 1);
    var y;
    x = register[x];
    x = convertNum(x);//index
    if (x >= 0 && x < 16) {
      y = convertNum(memory[x]);
      y = y * -1;
      memory[x] = deci_bin(y);
      cycles.fetch = true;
      cycles.decode = true;
      cycles.execute = true;
      return "111101" + "0" + "0" + "00" + "110";
    }
    else {
      return invalid;
    }
  }
  else if (type == "dirmemloc") {
    var x = arg.substring(1, arg.length - 1);
    var y;
    if (x[x.length - 1] == "b") {
      x = x.substring(0, x.length - 1);
      x = convertNum(x);
    }
    else if (x[x.length - 1] == "h") {
      x = x.substring(0, x.length - 1);
      x = parseInt(x, 16);
    }
    else {
      x = Number(x);
    }
    if (x >= 0 && x < 16) {
      y = convertNum(memory[x]);
      y = y * -1;
      memory[x] = deci_bin(y);
      cycles.fetch = true;
      cycles.decode = true;
      cycles.execute = true;
      let address = mem.toString(2);
      return "111101" + "0" + "0" + "00" + "101" + address;
    }
    else {
      return invalid;
    }
  }
  else if (type == "rmemloc") {
    var x = arg.substring(arg.indexOf("+") + 1, arg.length - 1);//shift mem
    var z = arg.substring(1, arg.indexOf("+"));//reg
    var y;
    if (x[x.length - 1] == "b") {
      x = x.substring(0, x.length - 1);
      x = convertNum(x);
    }
    else if (x[x.length - 1] == "h") {
      x = x.substring(0, x.length - 1);
      x = parseInt(x, 16);
    }
    else {
      x = Number(x);
    }
    z = convertNum(register[z]);
    x = z + x;
    if (x >= 0 && x < 16) {
      y = convertNum(memory[x]);
      y = ~y;
      memory[x] = deci_bin(y);
      cycles.fetch = true;
      cycles.decode = true;
      cycles.execute = true;
    }
  }
  else {
    return invalid;
  }
}

// not func
function not(arg) {
  cycles.fetch = false;
  cycles.decode = false;
  cycles.load = false;
  cycles.execute = false;
  cycles.store = false;
  var type = identify(arg);
  if (type == "reg") {
    var x = convertNum(register[arg]);
    x = ~x;
    register[arg] = deci_bin(x);
    cycles.fetch = true;
    cycles.decode = true;
    cycles.execute = true;
    return "111101" + "0" + "1" + "11" + get_regcode(arg);
  }
  else if (type == "memloc") {
    var x = arg.substring(1, arg.length - 1);
    var y;
    x = register[x];
    x = convertNum(x);//index
    if (x >= 0 && x < 16) {
      y = convertNum(memory[x]);
      y = ~y;
      memory[x] = deci_bin(y);
      cycles.fetch = true;
      cycles.decode = true;
      cycles.execute = true;
      return "111101" + "0" + "0" + "00" + "110";
    }
  }
  else if (type == "dirmemloc") {
    var x = arg.substring(1, arg.length - 1);
    var y;
    if (x[x.length - 1] == "b") {
      x = x.substring(0, x.length - 1);
      x = convertNum(x);
    }
    else if (x[x.length - 1] == "h") {
      x = x.substring(0, x.length - 1);
      x = parseInt(x, 16);
    }
    else {
      x = Number(x);
    }
    if (x >= 0 && x < 16) {
      y = convertNum(memory[x]);
      y = ~y;
      memory[x] = deci_bin(y);
      cycles.fetch = true;
      cycles.decode = true;
      cycles.execute = true;
      return "111101" + "0" + "0" + "00" + "101" + address;
    }
  }
  else if (type == "rmemloc") {
    var x = arg.substring(arg.indexOf("+") + 1, arg.length - 1);//shift mem
    var z = arg.substring(1, arg.indexOf("+"));//reg
    var y;
    if (x[x.length - 1] == "b") {
      x = x.substring(0, x.length - 1);
      x = convertNum(x);
    }
    else if (x[x.length - 1] == "h") {
      x = x.substring(0, x.length - 1);
      x = parseInt(x, 16);
    }
    else {
      x = Number(x);
    }
    z = convertNum(register[z]);
    x = z + x;
    if (x >= 0 && x < 16) {
      y = convertNum(memory[x]);
      y = ~y;
      memory[x] = deci_bin(y);
      cycles.fetch = true;
      cycles.decode = true;
      cycles.execute = true;
    }
  }
  else {
    return invalid;
  }
}


function and(des, src) {
  cycles.fetch = false;
  cycles.decode = false;
  cycles.load = false;
  cycles.execute = false;
  cycles.store = false;
  switch (flags_get(des, src)) {
    case "reg_reg":
      register[des] = deci_bin(convertNum(register[des]) & convertNum(register[src])); //and op
      cycles.fetch = true;
      cycles.decode = true;
      cycles.execute = true;
      return "001000" + "0" + "1" + "11" + get_regcode(des) + get_regcode(src);
    case "reg_imm":
      var x;
      if (src[src.length - 1] == "b") {
        x = src.substring(0, src.length - 1);
        x = convertNum(x);
      }
      else if (src[src.length - 1] == "h") {
        x = src.substring(0, src.length - 1);
        x = parseInt(x, 16);
      }
      else {
        x = Number(src);
      }
      register[des] = deci_bin(convertNum(register[des]) & x); // and op
      let num = x.toString(2);
      return "001000" + "0" + "1" + "00" + get_regcode(des) + num;
    case "reg_memloc":
      var w = src.substring(1, src.length - 1);
      var x = convertNum(register[w]);
      if (x >= 0 && x < 16) {
        register[des] = deci_bin(convertNum(register[des]) & convertNum(memory[x])); // and op
        cycles.fetch = true;
        cycles.decode = true;
        cycles.execute = true;
        return "001000" + "0" + "1" + "00" + get_regcode(des) + "110";
      }
      break;
    case "reg_rmemloc":
      var x = src.substring(1, src.length - 1);
      var y;
      if (src[src.length - 2] == "b") {
        x = src.substring(1, src.indexOf("+"));
        x = convertNum(register[x]);
        y = src.substring(src.indexOf("+") + 1, src.length - 2);
        y = x + convertNum(y);
      }
      else if (src[src.length - 2] == "h") {
        x = src.substring(1, src.indexOf("+"));
        x = convertNum(register[x]);
        y = src.substring(src.indexOf("+") + 1, src.length - 2);
        y = x + parseInt(y, 16);
      }
      else {
        x = src.substring(1, src.indexOf("+")); //rmem reg
        x = convertNum(register[x]);//rel reg val
        y = src.substring(src.indexOf("+") + 1, src.length - 1); //mem shift
        y = x + Number(y);//total index
      }
      if (y >= 0 && y < 16) {
        register[des] = deci_bin(convertNum(register[des]) & convertNum(memory[y])); // and op
        cycles.fetch = true;
        cycles.decode = true;
        cycles.execute = true;
        cycles.store = true;
      }
      else {
        return invalid;
      }
      break;
    case "reg_dirmemloc":
      var x = src.substring(1, src.length - 1);
      if (x[x.length - 1] == "b") {
        x = src.substring(1, src.length - 2);
        x = convertNum(x);
      }
      else if (x[x.length - 1] == "h") {
        x = src.substring(1, src.length - 2);
        x = parseInt(x, 16);
      }
      else {
        x = Number(x);
      }
      if (x >= 0 && x < 16) {
        register[des] = deci_bin(convertNum(register[des]) & convertNum(memory[x])); // and op
        cycles.fetch = true;
        cycles.decode = true;
        cycles.execute = true;
        cycles.store = true;
        let address = x.toString(2);
        return "001000" + "0" + "1" + "00" + get_regcode(des) + "110" + address;
      }
      break;
    case "memloc_reg":
      var w = des.substring(1, des.length - 1);
      var x = convertNum(register[w]);
      if (x <= 0 && x > 16) {
        memory[x] = deci_bin(convertNum(memory[x]) & convertNum(register[src])); // and op
        cycles.fetch = true;
        cycles.decode = true;
        cycles.execute = true;
        cycles.load = true;
        let address = x.toString(2);
        return "001000" + "0" + "0" + "00" + get_regcode(src) + "110" + address;
      }
      break;
    case "rmemloc_reg":
      var x = des.substring(1, des.length - 1);
      var y;
      if (x[x.length - 1] == "b") {
        x = x.substring(0, x.indexOf("+"));
        y = des.substring(des.indexOf("+") + 1, des.length - 2);
        x = convertNum(register[x]);
        y = x + convertNum(y);
      }
      else if (x[x.length - 1] == "h") {
        x = des.substring(1, des.indexOf("+"));
        x = convertNum(register[x]);
        y = des.substring(des.indexOf("+") + 1, des.length - 2);
        y = x + parseInt(y, 16);
      }
      else {
        x = des.substring(1, des.indexOf("+"));
        x = convertNum(register[x]);
        y = des.substring(des.indexOf("+") + 1, des.length - 1);
        y = x + Number(y);
      }
      if (y >= 0 && y < 16) {
        memory[y] = deci_bin(convertNum(register[src]) & convertNum(memory[y])); // and op
        cycles.fetch = true;
        cycles.decode = true;
        cycles.execute = true;
        cycles.load = true;
      }
      break;
    default:
      return invalid;
  }
}

//or func
function or(des, src) {
  cycles.fetch = false;
  cycles.decode = false;
  cycles.execute = false;
  cycles.store = false;
  switch (flags_get(des, src)) {
    case "reg_reg":
      register[des] = deci_bin(convertNum(register[des]) | convertNum(register[src])); //or op
      cycles.fetch = true;
      cycles.decode = true;
      cycles.execute = true;
      return "000010" + "0" + "1" + "11" + get_regcode(des) + get_regcode(src);
    case "reg_imm":
      var x;
      if (src[src.length - 1] == "b") {
        x = src.substring(0, src.length - 1);
        x = convertNum(x);
      }
      else if (src[src.length - 1] == "h") {
        x = src.substring(0, src.length - 1);
        x = parseInt(x, 16);
      }
      else {
        x = Number(src);
      }
      register[des] = deci_bin(convertNum(register[des]) | x); // or op
      cycles.fetch = true;
      cycles.decode = true;
      cycles.execute = true;
      let num = x.toString(2);
      return "000010" + "0" + "1" + "00" + get_regcode(des) + num;
    case "reg_memloc":
      var w = src.substring(1, src.length - 1);
      var x = convertNum(register[w]);
      if (x >= 0 && x < 16) {
        register[des] = deci_bin(convertNum(register[des]) | convertNum(memory[x])); // or op
        cycles.fetch = true;
        cycles.decode = true;
        cycles.execute = true;
        cycles.store = true;
        return "000010" + "0" + "1" + "00" + get_regcode(des) + "110";
      }
      break;
    case "reg_rmemloc":
      var x = src.substring(1, src.length - 1);
      var y;
      if (src[src.length - 2] == "b") {
        x = src.substring(1, src.indexOf("+"));
        x = convertNum(register[x]);
        y = src.substring(src.indexOf("+") + 1, src.length - 2);
        y = x + convertNum(y);
      }
      else if (src[src.length - 2] == "h") {
        x = src.substring(1, src.indexOf("+"));
        x = convertNum(register[x]);
        y = src.substring(src.indexOf("+") + 1, src.length - 2);
        y = x + parseInt(y, 16);
      }
      else {
        x = src.substring(1, src.indexOf("+")); //rmem reg
        x = convertNum(register[x]);//rel reg val
        y = src.substring(src.indexOf("+") + 1, src.length - 1); //mem shift
        y = x + Number(y);//total index
      }
      if (y >= 0 && y < 16) {
        register[des] = deci_bin(convertNum(register[des]) | convertNum(memory[y])); // or op
        cycles.fetch = true;
        cycles.decode = true;
        cycles.execute = true;
        cycles.store = true;
      }
      break;
    case "reg_dirmemloc":
      var x = src.substring(1, src.length - 1);
      if (x[x.length - 1] == "b") {
        x = src.substring(1, src.length - 2);
        x = convertNum(x);
      }
      else if (x[x.length - 1] == "h") {
        x = src.substring(1, src.length - 2);
        x = parseInt(x, 16);
      }
      else {
        x = Number(x);
      }
      if (x >= 0 && x < 16) {
        register[des] = deci_bin(convertNum(register[des]) | convertNum(memory[x])); // or op
        cycles.fetch = true;
        cycles.decode = true;
        cycles.execute = true;
        cycles.store = true;
        let address = x.toString(2);
        return "001000" + "0" + "1" + "00" + get_regcode(des) + "110" + address;
      }
      break;
    case "memloc_reg":
      var w = des.substring(1, des.length - 1);
      var x = convertNum(register[w]);
      if (x <= 0 && x > 16) {
        memory[x] = deci_bin(convertNum(memory[x]) | convertNum(register[src])); // or op
        cycles.fetch = true;
        cycles.decode = true;
        cycles.execute = true;
        cycles.load = true;
        let address = x.toString(2);
        return "001000" + "0" + "0" + "00" + get_regcode(src) + "110" + address;
      }
      else {
        return invalid;
      }
    case "rmemloc_reg":
      var x = des.substring(1, des.length - 1);
      var y;
      if (x[x.length - 1] == "b") {
        x = x.substring(0, x.indexOf("+"));
        y = des.substring(des.indexOf("+") + 1, des.length - 2);
        x = convertNum(register[x]);
        y = x + convertNum(y);
      }
      else if (x[x.length - 1] == "h") {
        x = des.substring(1, des.indexOf("+"));
        x = convertNum(register[x]);
        y = des.substring(des.indexOf("+") + 1, des.length - 2);
        y = x + parseInt(y, 16);
      }
      else {
        x = des.substring(1, des.indexOf("+"));
        x = convertNum(register[x]);
        y = des.substring(des.indexOf("+") + 1, des.length - 1);
        y = x + Number(y);
      }
      if (y >= 0 && y < 16) {
        memory[y] = deci_bin(convertNum(register[src]) | convertNum(memory[y])); // or op
        cycles.fetch = true;
        cycles.decode = true;
        cycles.execute = true;
        cycles.load = true;
      }
      else {
        return invalid;
      }
      break;
    default:
      return invalid;
  }
}

//function that negates value

//xor func
function xor(des, src) {
  cycles.fetch = false;
  cycles.decode = false;
  cycles.execute = false;
  cycles.store = false;
  switch (flags_get(des, src)) {
    case "reg_reg":
      register[des] = deci_bin(convertNum(register[des]) ^ convertNum(register[src])); //xor op
      cycles.fetch = true;
      cycles.decode = true;
      cycles.execute = true;
      return "000110" + "0" + "1" + "11" + get_regcode(des) + get_regcode(src);
    case "reg_imm":
      var x;
      if (src[src.length - 1] == "b") {
        x = src.substring(0, src.length - 1);
        x = convertNum(x);
      }
      else if (src[src.length - 1] == "h") {
        x = src.substring(0, src.length - 1);
        x = parseInt(x, 16);
      }
      else {
        x = Number(src);
      }
      register[des] = deci_bin(convertNum(register[des]) ^ x); // xor op
      cycles.fetch = true;
      cycles.decode = true;
      cycles.execute = true;
      let num = x.toString(2);
      return "000110" + "0" + "1" + "00" + get_regcode(des) + num;
    case "reg_memloc":
      var w = src.substring(1, src.length - 1);
      var x = convertNum(register[w]);
      if (x >= 0 && x < 16) {
        register[des] = deci_bin(convertNum(register[des]) ^ convertNum(memory[x])); // xor op
        cycles.fetch = true;
        cycles.decode = true;
        cycles.execute = true;
        cycles.store = true;
        return "000110" + "0" + "1" + "00" + get_regcode(des) + "110";
      }
      break;
    case "reg_rmemloc":
      var x = src.substring(1, src.length - 1);
      var y;
      if (src[src.length - 2] == "b") {
        x = src.substring(1, src.indexOf("+"));
        x = convertNum(register[x]);
        y = src.substring(src.indexOf("+") + 1, src.length - 2);
        y = x + convertNum(y);
      }
      else if (src[src.length - 2] == "h") {
        x = src.substring(1, src.indexOf("+"));
        x = convertNum(register[x]);
        y = src.substring(src.indexOf("+") + 1, src.length - 2);
        y = x + parseInt(y, 16);
      }
      else {
        x = src.substring(1, src.indexOf("+")); //rmem reg
        x = convertNum(register[x]);//rel reg val
        y = src.substring(src.indexOf("+") + 1, src.length - 1); //mem shift
        y = x + Number(y);//total index
      }
      if (y >= 0 && y < 16) {
        register[des] = deci_bin(convertNum(register[des]) ^ convertNum(memory[y])); // xor op
        cycles.fetch = true;
        cycles.decode = true;
        cycles.execute = true;
        cycles.store = true;
      }
      break;
    case "reg_dirmemloc":
      var x = src.substring(1, src.length - 1);
      if (x[x.length - 1] == "b") {
        x = src.substring(1, src.length - 2);
        x = convertNum(x);
      }
      else if (x[x.length - 1] == "h") {
        x = src.substring(1, src.length - 2);
        x = parseInt(x, 16);
      }
      else {
        x = Number(x);
      }
      if (x >= 0 && x < 16) {
        register[des] = deci_bin(convertNum(register[des]) ^ convertNum(memory[x])); // xor op
        cycles.fetch = true;
        cycles.decode = true;
        cycles.execute = true;
        cycles.store = true;
        let address = x.toString(2);
        return "000110" + "0" + "1" + "00" + get_regcode(des) + "110" + address;
      }
      else {
        return invalid;
      }
    case "memloc_reg":
      var w = des.substring(1, des.length - 1);
      var x = convertNum(register[w]);
      if (x <= 0 && x > 16) {
        memory[x] = deci_bin(convertNum(memory[x]) ^ convertNum(register[src])); // xor op
        cycles.fetch = true;
        cycles.decode = true;
        cycles.execute = true;
        cycles.load = true;
        let address = x.toString(2);
        return "000110" + "0" + "0" + "00" + get_regcode(src) + "110" + address;
      }
      break;
    case "rmemloc_reg":
      var x = des.substring(1, des.length - 1);
      var y;
      if (x[x.length - 1] == "b") {
        x = x.substring(0, x.indexOf("+"));
        y = des.substring(des.indexOf("+") + 1, des.length - 2);
        x = convertNum(register[x]);
        y = x + convertNum(y);
      }
      else if (x[x.length - 1] == "h") {
        x = des.substring(1, des.indexOf("+"));
        x = convertNum(register[x]);
        y = des.substring(des.indexOf("+") + 1, des.length - 2);
        y = x + parseInt(y, 16);
      }
      else {
        x = des.substring(1, des.indexOf("+"));
        x = convertNum(register[x]);
        y = des.substring(des.indexOf("+") + 1, des.length - 1);
        y = x + Number(y);
      }
      if (y >= 0 && y < 16) {
        memory[y] = deci_bin(convertNum(register[src]) ^ convertNum(memory[y])); // xor op
        cycles.fetch = true;
        cycles.decode = true;
        cycles.execute = true;
        cycles.load = true;
      }
      break;
    default:
      return invalid;
  }
}