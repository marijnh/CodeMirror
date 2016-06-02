var isLightTheme = 1;

var myCodeMirror = CodeMirror(document.body, {
  value: "console.log('potato')\n",
  mode:  "javascript",
  lineNumbers: true,
  theme: "3024-day",
  autoCloseBrackets: true,
  inputStyle: "contenteditable",
  // keyMap: "vim"

});
// debugger;

codeArea =document.getElementsByClassName('CodeMirror')[0];
codeArea.addEventListener("keyup", function() {
  // console.log('changing the value');
  eval(myCodeMirror.doc.getValue());
})
window.onload = function(){
  document.getElementById('noOfLines').innerHTML = 'no of lines - ' + myCodeMirror.lineCount();
  //add content editable to the parent class - 'CodeMirror-lines'
  document.getElementsByClassName('CodeMirror-lines')[0].contentEditable = true;
}

/******* ADDED EDITOR FUNCTIONALITES *********/

myCodeMirror.setOption("extraKeys", {
  'Ctrl-L': function(cm) {
    document.getElementById('noOfLines').innerHTML = 'no of lines - ' + myCodeMirror.lineCount();
  }
});

/******* UTILITIES *********/

function toggleTheme() {
  if(isLightTheme == 1) {
    myCodeMirror.setOption('theme','3024-night');
    isLightTheme = 0;
  }
  else {
    myCodeMirror.setOption('theme','3024-day');
    isLightTheme = 1;
  }
}
