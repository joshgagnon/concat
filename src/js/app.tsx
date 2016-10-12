import "babel-polyfill";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider, connect } from 'react-redux';
import { Store, createStore } from 'redux';
import configureStore from './configureStore.ts';
import '../style/style.scss';
import * as axios from 'axios';
import { addDocuments, updateDocument, submitDocuments, moveDocument, removeDocument, updateForm } from './actions.ts';
import Header from './header.tsx';
import Footer from './footer.tsx';
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { DragSource, DropTarget, DragDropContext } from 'react-dnd';
import *  as HTML5Backend from 'react-dnd-html5-backend';
import * as PDF from './pdf.tsx'

const serialize = function(obj, prefix?) {
  var str = [];
  for(var p in obj) {
    if (obj.hasOwnProperty(p)) {
      var k = prefix ? prefix + "[]" : p, v = obj[p];
      str.push(typeof v == "object" ?
        serialize(v, k) :
        k + "=" + encodeURIComponent(v));
    }
  }
  return str.filter(s => s).join("&");
}

function eachSeries(arr: Array<any>, iteratorFn: Function) {
    return arr.reduce(function(p, item) {
        return p.then(function() {
            return iteratorFn(item);
        });
    }, Promise.resolve());
}

const store = configureStore({});

type Document = {
    filename: string;
    uuid?: string;
    file: File;
    status: string;
    data: ArrayBuffer;
    progress?: number;
};


interface DocumentHandlerProps {
    addDocuments(files: any);
    updateDocument(options: Object);
    submitDocuments(options: Object);
    moveDocument(options: Object);
    removeDocument(options: Object);
    updateForm(options: Object);
    documents: any;
    form: any;
};

interface DocumentListProps {
    removeDocument(options: Object);
    updateDocument(options: Object);
    moveDocument(options: Object);
    documents: any;
};


interface DocumentViewProps {
    document: Document;
    updateDocument: Function;
    removeDocument: Function;
    isDragging: boolean;
    connectDragSource: Function;
    connectDropTarget: Function;
    index: number;

}

interface IDocumentHandler {
    onDrop(files: any);
};

interface FileReaderEventTarget extends EventTarget {
    result:string
}

interface FileReaderEvent extends Event {
    target: FileReaderEventTarget;
    getMessage():string;
}

const documentDragSource = {
  beginDrag(props) {
    return {
      id: props.id,
      index: props.index
    };
  }
};


const documentDragTarget = {
  hover(props, monitor, component) {
    const dragIndex = monitor.getItem().index;
    const hoverIndex = props.index;
    // Don't replace items with themselves
    if (dragIndex === hoverIndex) {
      return;
    }

    // Determine rectangle on screen
    const hoverBoundingRect = ReactDOM.findDOMNode(component).getBoundingClientRect();

    // Get vertical middle
    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

    // Determine mouse position
    const clientOffset = monitor.getClientOffset();

    // Get pixels to the top
    const hoverClientY = clientOffset.y - hoverBoundingRect.top;
    props.moveDocument(dragIndex, hoverIndex);

    // Note: we're mutating the monitor item here!
    // Generally it's better to avoid mutations,
    // but it's good here for the sake of performance
    // to avoid expensive index searches.
    monitor.getItem().index = hoverIndex;
  }
};


class DocumentView extends React.Component<DocumentViewProps, {}>  {
    render() {
        const { isDragging, connectDragSource, connectDropTarget } = this.props;
        const opacity = isDragging ? 0 : 1;

        return connectDragSource(connectDropTarget(<div className="document" style={{opacity}}>
                <button className="remove" onClick={() => this.props.removeDocument()}>✖</button>
                <div className="image">
                    { this.props.document.uuid && <img src={`/thumb/${this.props.document.uuid}`} /> }
                </div>
                <div className="filename">
                    { this.props.document.filename }
                </div>
                <ReactCSSTransitionGroup transitionName="progress" transitionEnterTimeout={300} transitionLeaveTimeout={500}>
                { (this.props.document.status === 'posting')  &&

                    <div className="progress" key="progress">
                      <div className="progress-bar progress-bar-striped active" style={{width: `${this.props.document.progress*100}%`}}>
                      </div>
                    </div>
                   }
                     </ReactCSSTransitionGroup>
            </div>));
    }
}

const DraggableDocumentView = DragSource('DOCUMENTS', documentDragSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging()
}))(DocumentView);

const DraggableDroppableDocumentView = DropTarget('DOCUMENTS', documentDragTarget, connect => ({
  connectDropTarget: connect.dropTarget()
}))(DraggableDocumentView);


class DocumentList extends React.Component<DocumentListProps, {}> {

    constructor(props){
        super(props);
        this.moveDocument = this.moveDocument.bind(this);

    }
    moveDocument(dragIndex, hoverIndex){
        const dragDocument = this.props.documents.filelist[dragIndex];
        this.props.moveDocument({sourceIndex: dragIndex, destIndex: hoverIndex});
    }
    componentWillReceiveProps(props){
        this.uploadData(props);
    }
    componentWillMount(){
        this.uploadData(this.props);
    }
    uploadData(props){
        const unUploaded = props.documents.filelist.filter(d => !d.status);
        unUploaded.map(doc => {
            props.updateDocument({id: doc.id, status: 'posting', progress: 0});
        });
        eachSeries(unUploaded, (doc) => {

            const data = new FormData();
            data.append('file[]', doc.file);
            return axios.post('/upload', data,
                {
                    progress: (progressEvent) => {
                        // upload loading percentage
                        const percentCompleted = progressEvent.loaded / progressEvent.total;
                        props.updateDocument({id: doc.id, progress: percentCompleted});
                    }
                })
            .then((response) => {
                props.updateDocument({id: doc.id, status: 'complete', uuid: response.data[doc.filename]});
            })
        });
    }

    render() {
         return <div className="document-list">
            { this.props.documents.filelist.map((f, i) => {
                return <DraggableDroppableDocumentView
                    document={f}
                    key={f.id}
                    index={i}
                    updateDocument={(data) => {
                        this.props.updateDocument(Object.assign({id: f.id}, data));
                    }}
                    removeDocument={() => this.props.removeDocument({id: f.id})}
                    moveDocument={this.moveDocument}/>
                })}
            </div>
    }
}

class FileDropZone extends React.Component<{connectDropTarget: Function, isOver: boolean, canDrop: boolean}, {}> {
    render() {
        const { connectDropTarget, isOver, canDrop } = this.props;
        return connectDropTarget(<div className="dropzone">
                                 { this.props.children }
                                 <div className="push-catch"></div>
                                </div>
        );
    }
}

const fileTarget = {
    drop(props, monitor) {
        props.onDrop(monitor.getItem().files.filter(f => f.type === 'application/pdf'));
    }
};

const ConnectedFileDropZone = DropTarget("__NATIVE_FILE__", fileTarget, (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  canDrop: monitor.canDrop()
}))(FileDropZone);


class DocumentHandler extends React.Component<DocumentHandlerProps, {}> implements IDocumentHandler {
    _fileInput;

    constructor(props){
        super(props);
        this.onDrop = this.onDrop.bind(this);
        this.collectFiles = this.collectFiles.bind(this);
        this.onClick = this.onClick.bind(this);
    }

    onDrop(files) {
        this.props.addDocuments(files.map(f => ({
            filename: f.name,
            file: f
        })));
    }

    collectFiles(event) {
       this.onDrop([].filter.call(event.target.files, f => f.type === 'application/pdf'));
    }
    onClick() {
        if(this._fileInput){
            this._fileInput.value = null;
            this._fileInput.click();
        }
    }

    render() {
        const loaded = !!this.props.documents.filelist.length && this.props.documents.filelist.every(f => f.status === 'complete');
        const url = '/concat?' + serialize({file_ids: this.props.documents.filelist.map(f => f.uuid), deskew: this.props.form.deskew || false});
        return  <ConnectedFileDropZone onDrop={this.onDrop}>
            <div className="body">
            <Header />
                 <div className="explanation" onClick={this.onClick}>
            Drag PDFs here to join them together
                <input type="file" multiple name="files" style={{display: 'none'}} ref={(el) => this._fileInput = el} onChange={this.collectFiles}/>
            </div>
            <div className="container">
                <DocumentList
                    updateDocument={this.props.updateDocument}
                    documents={this.props.documents}
                    moveDocument={this.props.moveDocument}
                    removeDocument={this.props.removeDocument}
                     />
                { loaded && <div className="button-bar">
                    <a href={url} className="btn btn-primary">Merge</a>
                      {/* <div className="checkbox"><label><input type="checkbox" name="deskew"
                        checked={this.props.form.deskew || false}
                        onChange={(e) => {
                            this.props.updateForm({key: 'deskew', value: (e.target as any).checked})
                    }}/>Deskew</label>
                </div> */}
                </div> }
            </div>
            <Footer />
            </div>
            </ConnectedFileDropZone>
    }
}

const DragContext = DragDropContext(HTML5Backend)(DocumentHandler)

const DragContextDocumentHandlerConnected  = connect(state => ({documents: state.documents, form: state.form}), {
    addDocuments: addDocuments,
    updateDocument: updateDocument,
    submitDocuments: submitDocuments,
    removeDocument: removeDocument,
    moveDocument: moveDocument,
    updateForm: updateForm
})(DragContext);



class App extends React.Component<{}, {}> {
    render() {
        return <DragContextDocumentHandlerConnected  />
    }
}



ReactDOM.render(
    <Provider store={store}>
    <App />
  </Provider>,
    document.getElementById("main")
);