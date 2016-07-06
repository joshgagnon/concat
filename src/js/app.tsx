import "babel-polyfill";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider, connect } from 'react-redux';
import { Store, createStore } from 'redux';
import configureStore from './configureStore.ts';
import * as DropZone from 'react-dropzone';
import '../style/style.scss';
import * as axios from 'axios';
import * as PDF from 'react-pdf-component';
import { addDocuments, updateDocuments, submitDocuments} from './actions.ts'
const store = configureStore({});

type Document = {
    filename: string;
    uuid: string;
    data: ArrayBuffer;
    uploaded?: number;
};


type Documents = {
    order: Array<number>
    list: Array<Document>
};


interface IDocumentHandler {
    addDocuments(files: any);
    updateDocuments(files: any);
    submitDocuments(options: Object);
    documents: any;
};

class DocumentHandler extends React.Component<IDocumentHandler, {}> {
    onDrop(files) {
        this.props.addDocuments(files);
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
        return <DropZone ref="dropzone" onDrop={this.onDrop} disableClick={true} disablePreview={true} accept={'application/pdf'}>
            <div>

        </div>
        <div className="document-list">

        </div>
        </DropZone>
    }
}


const DocumentHandlerConnected = connect(state => ({documents: state.documents}), {
    addDocuments: addDocuments,
    updateDocuments: updateDocuments,
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