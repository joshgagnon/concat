import * as React from "react";

export default class Header extends React.Component<{}, {}> {
    render(){
        return <div className="header">
        <nav className="navbar navbar-default">
        </nav>
        <div className="title">
            <h1><span className="big">C</span><span>ON</span><span className="big">C</span><span>AT</span></h1>
            </div>

        <div className="logo">
        <div className="cat">
            <div className="bg"></div>
            <div className="torso"></div>
            <div className="ear right"></div>
            <div className="ear left"></div>
            <div className="eye left">
                <div className="glint"> </div>
            </div>
            <div className="eye right">
                    <div className="glint"> </div>
            </div>
            <div className="whiskers right">
                <div className="top"></div>
                <div className="middle"></div>
                <div className="bottom"></div>
            </div>
            <div className="whiskers left">
                <div className="top"></div>
                <div className="middle"></div>
                <div className="bottom"></div>
            </div>
            <div className="nose"></div>
            <div className="mouth">
                <div className="tongue"></div>
            </div>
            <div className="tail-curve">
                <div className="tail-top">
                </div>
            </div>
        </div>
        </div>
        <div className="explanation">
        Drag PDFs here to join them together
        </div>
        </div>
       }
}