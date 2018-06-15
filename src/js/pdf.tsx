import * as React from "react";
import { findDOMNode } from "react-dom";
import * as Promise from 'bluebird';

const PDFJS = require('pdfjs-dist');

interface PDFProps {
    data: ArrayBuffer;
    width: number
    finished: Function;
    worker?: boolean;
    url?: string;
    scale?: number;
}

class PDF extends React.Component<PDFProps, any> {
    _pdfPromise;
    _pagePromises;
    constructor(props) {
        super(props);
        this._pdfPromise = null;
        this._pagePromises = null;
        this.state = {};
        this.completeDocument = this.completeDocument.bind(this);
    }

    componentDidMount() {
        if(this.props.worker === false){
            PDFJS.disableWorker = true;
        }
        this.loadDocument(this.props);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return true;
       // return shallowCompare(this, nextProps, nextState);
    }

    componentWillReceiveProps(newProps) {
        if((newProps.data && newProps.data !== this.props.data)) {
            this.loadDocument(newProps);
        }
    }

    loadDocument(props) {
        if(props.data || props.url){
            this.cleanup();
            this._pdfPromise = Promise.resolve(PDFJS.getDocument(props.data ? { data: props.data } : props.url))
                .then(this.completeDocument)
                .catch(PDFJS.MissingPDFException, () => this.setState({error: "Can't find PDF"}))
                .catch((e) => this.setState({error: e.message}))
        }
    }

    completeDocument(pdf) {
        this.setState({ pdf: pdf, error: null });
        this._pagePromises && this._pagePromises.isPending() && this._pagePromises.cancel();
        return this._pagePromises = Promise.map(new Array(this.state.pdf.numPages).fill(), (p, i) => {
            return pdf.getPage(i + 1);
        })
        .then((pages) => {
            this.setState({ pages: pages });
        })
    }

    componentWillUnmount() {
        this.cleanup();
    }

    cleanup() {
        this._pdfPromise && this._pdfPromise.isPending() && this._pdfPromise.cancel();
        this._pagePromises && this._pagePromises.isPending() && this._pagePromises.cancel();
    }

    componentDidUpdate() {
        if(this.state.pdf && this.state.pages){
            this.state.pages.map((page, i) => {
                const canvas = findDOMNode(this.refs[i]) as HTMLCanvasElement,
                    context = canvas.getContext('2d'),
                    scale = this.props.scale || 1,
                    viewport = page.getViewport(canvas.width / page.getViewport(scale).width);
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                page.render({
                    canvasContext: context,
                    viewport: viewport
                });
            });
            this.props.finished && this.props.finished();
        }
    }

    render() {
        if(this.state.error){
            return <div>{ this.state.error }</div>
        }
        if(!this.state.pdf){
            return <div>No Document to show</div>
        }
        return <div>
            { (new Array(this.state.pdf.numPages)).fill().map((page, i) => {
                return <canvas key={i} ref={i} width={ this.props.width || 1500}  />
            }) }
        </div>
    }
}


export default PDF;
