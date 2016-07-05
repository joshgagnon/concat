import "babel-polyfill";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider, connect } from 'react-redux';
import { Store, createStore } from 'redux';
import configureStore from './configureStore.ts';
import * as fetch from 'isomorphic-fetch';
import * as DropZone from 'react-dropzone';
import '../style/style.scss';

const store = configureStore({});

class App extends React.Component<{}, {}> {
    onDrop(event) {

    }

    render() {
        return <DropZone ref="dropzone" onDrop={this.onDrop} disableClick={true} disablePreview={true} accept={'application/pdf'}>
            <div>
            Hi
        </div>
        </DropZone>
    }
}

ReactDOM.render(
    <Provider store={store}>
    <App />
  </Provider>,
    document.getElementById("main")
);