declare namespace ReactPDF {
    import React = __React;
    interface ReactPDFProps {
        data?: ArrayBuffer
    }

    export class PDF extends React.Component<ReactPDFProps, {}> {
    }

}

declare module "react-pdf-component" {
    const PDF: typeof ReactPDF.PDF;
    export = PDF;
}