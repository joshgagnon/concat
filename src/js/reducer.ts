import { combineReducers } from 'redux';
import { Action } from './actions.ts'

let index = 0;

const documents = (state = {filelist: []}, action) => {
    switch(action.type){
        case "ADD_DOCUMENTS":
            return Object.assign({}, state, {filelist: state.filelist.concat(action.payload.map(f => {
                f.id = index++;
                return f;
            }))});
        case "REMOVE_DOCUMENTS":
            return Object.assign({}, state, {filelist: state.filelist.concat(action.payload.map(f => {
                f.id = index++;
                return f;
            }))});
        case "UPDATE_DOCUMENT":
            const i = state.filelist.findIndex(f => f.id === action.payload.id);
            const filelist = [...state.filelist];
            filelist[i] = Object.assign({}, filelist[i], action.payload);
            return Object.assign({}, state, {filelist: filelist});


    }
    return state;
}

const rootReducer = combineReducers({
    documents
});

export default rootReducer;