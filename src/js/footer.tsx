import * as React from "react";

export default class Footer extends React.Component<{}, {}> {
    render(){
    return <div className="footer">
        <div className="container">
            <div className="footer-bar">
            <div className="catalex-logo"></div>
            <a href="https://catalex.nz">© {(new Date()).getFullYear()} CataLex®</a>
            </div>
        </div>
    </div>
    }
}