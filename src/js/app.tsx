import "babel-polyfill";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider, connect } from 'react-redux';
import { Store, createStore } from 'redux';
import configureStore from './configureStore.ts';
import * as DropZone from 'react-dropzone';
import '../style/style.scss';
import * as axios from 'axios';
import PDF from './pdf.tsx';
import { addDocuments, updateDocument, submitDocuments} from './actions.ts';

const store = configureStore({});

type Document = {
    filename: string;
    uuid?: string;
    file: File
    uploaded?: number;
    data: ArrayBuffer;

};


interface DocumentHandlerProps {
    addDocuments(files: any);
    updateDocument(options: Object);
    submitDocuments(options: Object);
    documents: any;
};


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


class DocumentView extends React.Component<{document: Document, updateData: Function}, {}> {
    componentWillReceiveProps(props){
        this.loadData(props);
    }
    componentWillMount(){
        this.loadData(this.props);
    }
    loadData(props){
        if(!props.document.data){
            const reader = new FileReader();
            reader.onload = (event:FileReaderEvent) => {
                this.props.updateData(event.target.result)
            };
            reader.readAsArrayBuffer(props.document.file);
        }
    }

    render() {
        console.log(PDF)
        return <div>
            { this.props.document.data &&  <PDF  data={this.props.document.data } /> }
        </div>
    }
}

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

        /*const data = new FormData();

        files.map(f => {
            data.append('file[]', f);
        });

        axios.post('/upload', data,
            {
                progress: (progressEvent) => {
                    console.log(progressEvent)
                    // upload loading percentage
                    const percentCompleted = progressEvent.loaded / progressEvent.total;

                }
            })*/
    }

    render() {
        console.log(this.props)
        return <DropZone ref="dropzone" onDrop={this.onDrop} disableClick={true} disablePreview={true} accept={'application/pdf'}>
            <div>

        </div>
        <div className="document-list">
            { this.props.documents.filelist.map((f, i) => {
                return <DocumentView document={f} key={i} updateData={(data) => {
                    this.props.updateDocument({id: f.id, data:data});
                }}/>
            })}
        </div>
        </DropZone>
    }
}


const DocumentHandlerConnected = connect(state => ({documents: state.documents}), {
    addDocuments: addDocuments,
    updateDocument: updateDocument,
    submitDocuments: submitDocuments
})(DocumentHandler);


class App extends React.Component<{}, {}> {
    render() {
        return <DocumentHandlerConnected />
    }
}



ReactDOM.render(
    <Provider store={store}>
    <App />
  </Provider>,
    document.getElementById("main")
);