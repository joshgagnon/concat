import * as React from "react";

export default class Footer extends React.Component<{}, {}> {
    render(){
    return <div className="footer">
    <div className="container">
        <div className="footer-bar">
        <a href="https://browser.catalex.nz" className="browser-logo"></a>
        <div className="catalex-logo"></div>
        <a href="https://catalex.nz">© 2016 CataLex®</a>
        </div>
    </div>
    </div>
    }
}