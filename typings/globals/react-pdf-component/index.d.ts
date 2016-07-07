declare module "react-pdf-component" {
    import * as React from 'react';

    interface ReactPDFProps {
        data?: ArrayBuffer,
        worker?: boolean
    }

    class PDF extends React.Component<ReactPDFProps, {}>{

    }
    export default PDF;
}