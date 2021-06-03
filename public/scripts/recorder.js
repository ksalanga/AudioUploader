import { record } from "/scripts/vmsg.js";

let recordButton = document.getElementById("record");

var blobObj = null

recordButton.onclick = function() {
  if (blobObj != null) {
    close()
  }

  record({wasmURL: "/scripts/vmsg.wasm"}).then(blob => {
    blobObj = blob
    
    // Append Create Recording to the end of the Box
    var tag = document.createElement("p")
    tag.id="finishedRecording"
    var text = document.createTextNode("Audio File Recorded")
    var exitButton = document.createElement("button")
    exitButton.id = "close"
    exitButton.innerHTML = "X"
    exitButton.onclick = close
    tag.appendChild(text)
    tag.appendChild(exitButton)
    var element = document.getElementById("box")
    element.appendChild(tag)

    // Append Audio Preview
    var url = URL.createObjectURL(blob);
    var preview = document.createElement('audio');
    preview.controls = true;
    preview.src = url;
    document.getElementsByClassName("mainbar")[0].appendChild(preview);
  })
}

let form = document.getElementById('mp3Form');

form.addEventListener("submit", submitAudio) 

function submitAudio(event) {
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
    document.getElementById('submitField').value = ''
    close()
  } else {
    alert('Record some Audio to upload')
  }
  event.preventDefault()
}

close = function() {
  document.getElementById('finishedRecording').remove()
  blobObj = null
  var audioPreview = document.getElementsByTagName("audio")[0]
  audioPreview.remove()
}