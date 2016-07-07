import "babel-polyfill";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider, connect } from 'react-redux';
import { Store, createStore } from 'redux';
import configureStore from './configureStore.ts';
import * as DropZone from 'react-dropzone';
import '../style/style.scss';
import * as axios from 'axios';
import { addDocuments, updateDocument, submitDocuments} from './actions.ts';
import Header from './header.tsx';
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';

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


class DocumentView extends React.Component<{document: Document, updateDocument: Function}, {}> {

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
                        console.log(progressEvent)
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
        console.log(this.props.document.status)
        return <div className="document">
                <div className="image">
                </div>
                <div className="filename">
                    { this.props.document.filename }
                </div>
                <ReactCSSTransitionGroup transitionName="progress" transitionEnterTimeout={300} transitionLeaveTimeout={500}>
                { this.props.document.status === 'posting'  &&

                    <div className="progress" key="progress">
                      <div className="progress-bar progress-bar-striped active" style={{width: `${this.props.document.progress*100}%`}}>
                      </div>
                    </div>
                   }
                     </ReactCSSTransitionGroup>
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
        return <div>
        <DropZone className="dropzone" ref="dropzone" onDrop={this.onDrop} disableClick={true} disablePreview={true} accept={'application/pdf'} style={{}}>
           </DropZone>
        <Header />

        <div className="container">
            <div className="document-list">
            { this.props.documents.filelist.map((f, i) => {
                return <DocumentView document={f} key={i} updateDocument={(data) => {
                    this.props.updateDocument(Object.assign({id: f.id}, data));
                    }}/>
                })}
            </div>
        </div>

             </div>


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