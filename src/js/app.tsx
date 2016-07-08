import "babel-polyfill";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider, connect } from 'react-redux';
import { Store, createStore } from 'redux';
import configureStore from './configureStore.ts';
import '../style/style.scss';
import * as axios from 'axios';
import { addDocuments, updateDocument, submitDocuments, moveDocument } from './actions.ts';
import Header from './header.tsx';
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { DragSource, DropTarget, DragDropContext } from 'react-dnd';
import *  as HTML5Backend from 'react-dnd-html5-backend';

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
    documents: any;
};

interface DocumentListProps {
    updateDocument(options: Object);
    moveDocument(options: Object);
    documents: any;
};


interface DocumentViewProps {
    document: Document;
    updateDocument: Function;
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
    componentWillReceiveProps(props){
        this.uploadData(props);
    }
    componentWillMount(){
        this.uploadData(this.props);
    }
    /*loadData(props){
        if(!props.document.data){
            const reader = new FileReader();
            reader.onload = (event:FileReaderEvent) => {
                this.props.updateData(event.target.result)
            };
            reader.readAsArrayBuffer(props.document.file);
        }
    }*/

    uploadData(props){
        if(!props.document.status){
            props.updateDocument({status: 'posting', progress: 0});
            const data = new FormData();
            data.append('file[]', props.document.file);
            axios.post('/upload', data,
                {
                    progress: (progressEvent) => {
                        // upload loading percentage
                        const percentCompleted = progressEvent.loaded / progressEvent.total;
                        props.updateDocument({progress: percentCompleted});
                    }
                })
            .then((response) => {

                props.updateDocument({status: 'complete', uuid: response.data[props.document.filename]});
            })
        }
    }

    render() {
        const { isDragging, connectDragSource, connectDropTarget } = this.props;
        const opacity = isDragging ? 0 : 1;

        return connectDragSource(connectDropTarget(<div className="document" style={{opacity}}>
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
                    moveDocument={this.moveDocument}/>
                })}
            </div>
    }
}

class FileDropZone extends React.Component<{connectDropTarget: Function, isOver: boolean, canDrop: boolean}, {}> {
    render() {
        const { connectDropTarget, isOver, canDrop } = this.props;
        return connectDropTarget(
            <div className="dropzone"></div>
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
    constructor(props){
        super(props);
        this.onDrop = this.onDrop.bind(this);
    }

    onDrop(files) {
        this.props.addDocuments(files.map(f => ({
            filename: f.name,
            file: f
        })));
    }

    render() {
        const loaded = !!this.props.documents.filelist.length && this.props.documents.filelist.every(f => f.status === 'complete') || true;
        return <div>
            <ConnectedFileDropZone onDrop={this.onDrop} />
            <Header />
            <div className="container">
                <DocumentList
                    updateDocument={this.props.updateDocument}
                    documents={this.props.documents}
                    moveDocument={this.props.moveDocument} />
                { loaded && <div className="button-bar">
                    <button className="btn btn-primary">Merge</button>
                </div>}
            </div>
            </div>


    }
}

const DocumentHandlerConnected = connect(state => ({documents: state.documents}), {
    addDocuments: addDocuments,
    updateDocument: updateDocument,
    submitDocuments: submitDocuments,
    moveDocument: moveDocument
})(DocumentHandler);


const DragContextDocumentHandlerConnected = DragDropContext(HTML5Backend)(DocumentHandlerConnected)

class App extends React.Component<{}, {}> {
    render() {
        return <DragContextDocumentHandlerConnected />
    }
}



ReactDOM.render(
    <Provider store={store}>
    <App />
  </Provider>,
    document.getElementById("main")
);