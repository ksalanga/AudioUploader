import { record } from "/scripts/vmsg.js";

let recordButton = document.getElementById("record");

var blobObj = null

recordButton.onclick = function() {
  record({wasmURL: "/scripts/vmsg.wasm"}).then(blob => {
    blobObj = blob
    
    var tag = document.createElement("p")
    tag.id="finishedRecording"
    var text = document.createTextNode("Audio File Recorded")
    tag.appendChild(text)
    var element = document.getElementById("box")
    element.appendChild(tag)
    document.getElementById('box').appendChild(a)
  })
}

let form = document.getElementById('mp3Form');

form.onsubmit = () => {
  var fileName = form.elements[0].value

  if (fileName == "") {
    alert('Please enter a name for your file')
  } else if (blobObj != null) {
    const formData = new FormData()
    formData.append('name', fileName) 
    formData.append('audio-file', blobObj)
    
    const options = {
      method: 'POST',
      body: formData
    }
    fetch('/recordingsDirectory', options)
  } else {
    alert('Record some Audio to upload')
  }
}