
var dropzone = document.getElementById('drop-zone');
var upload = document.getElementById('upload');
var list =  document.getElementById('list');
var items = []
var draggingIndex;
var placeholder = document.createElement('li');
placeholder.className="item placeholder";



function render(){
    list.innerHTML='';
    items.forEach(function(item, i){
        var li = document.createElement('li');
        li.className="item";
        var title = document.createElement('span');
        title.innerHTML = item.name;
        var button = document.createElement('button');
        button.innerHTML = '&#10006;'
        button.onclick = function(){
            items.splice(i, 1);
            render();
        }
        li.appendChild(title);
        li.appendChild(button);
        list.appendChild(li);
        li.draggable="true";
        li.addEventListener('dragstart', function(e){
            e.dataTransfer.dropEffect = "none";
            draggingIndex = i;
        });
    });
    if(items.length){
        upload.classList.add('visible');
    }
    else{
        upload.classList.remove('visible');
    }
}
render();


upload.addEventListener('click', function(){
    var formData = new FormData(),
        xhr = new XMLHttpRequest();
    items.forEach(function(item, i){
        formData.append(item.name, item);
    });
    xhr.responseType = 'arraybuffer';
    xhr.open('POST', '/concat');
    xhr.send(formData);
    xhr.onload = function () {
        if (this.status === 200) {
            var filename = "";
            var disposition = xhr.getResponseHeader('Content-Disposition');
            if (disposition && disposition.indexOf('attachment') !== -1) {
                var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                var matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) filename = matches[1].replace(/['"]/g, '');
            }
            var type = xhr.getResponseHeader('Content-Type');
            var blob = new Blob([this.response], { type: type });
            if (typeof window.navigator.msSaveBlob !== 'undefined') {
                // IE workaround for "HTML7007: One or more blob URLs were revoked by closing the blob for which they were created. These URLs will no longer resolve as the data backing the URL has been freed."
                window.navigator.msSaveBlob(blob, filename);
            } else {
                var downloadUrl = window.URL.createObjectURL(blob);

                if (filename) {
                    // use HTML5 a[download] attribute to specify filename
                    var a = document.createElement("a");
                    // safari doesn't support this yet
                    if (typeof a.download === 'undefined') {
                        window.location = downloadUrl;
                    } else {
                        a.href = downloadUrl;
                        a.download = filename;
                        document.body.appendChild(a);
                        a.click();
                    }
                } else {
                    window.location = downloadUrl;
                }

                setTimeout(function () { URL.revokeObjectURL(downloadUrl); }, 100); // cleanup
            }
        }
    };

});


list.addEventListener('dragover', function(e) {
    if(e.dataTransfer.files.length){
        return;
    }
    if(e.srcElement){
        this.classList.add("over")
    }
    var offset = e.clientY, height= e.srcElement.offsetHeight/2, child;
    [].forEach.call(list.children, function(li, i){
        if(!child) {
            child = li;
        }
        if(offset > li.offsetTop){
            child = li;
        }
    });
    if(offset > (child.offsetTop) && child === list.lastChild){
        list.appendChild(placeholder)
    }
    else{
        list.insertBefore(placeholder, child);
    }
}, false);



list.addEventListener('drop', function(e) {

    if(e.dataTransfer.files.length){
        return;
    }
    this.classList.remove("over")
    var i = 0, index;

    var srcIndex = draggingIndex;

    [].forEach.call(list.children, function(li){
        if(li === placeholder){
            index = i-1;
        }
        else{
            i++;
        }
    });
    index = Math.max(0, index);
    if(srcIndex !== index){
        var item =items[srcIndex];
        items.splice(srcIndex, 1);
        items.splice(index, 0, item);
        render();
    }

}, false);

dropzone.addEventListener('dragover', function () { this.className = 'hovering'; return false; }, false);
dropzone.addEventListener('dragend', function () { this.className = ''; return false; }, false);
dropzone.addEventListener('drop', function (e) {
  this.className = '';
  e.preventDefault();
  [].forEach.call(e.dataTransfer.files, function(f){
    if(f.type === 'application/pdf'){
        items.push(f);
    }
  })
  render();
  return false;
}, false);


window.addEventListener("dragover",function(e){
  e = e || event;
  e.preventDefault();
},false);