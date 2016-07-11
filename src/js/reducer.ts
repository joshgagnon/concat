import { combineReducers } from 'redux';
import { Action } from './actions.ts'


let index = 0;

const documents = (state = {filelist: []}, action) => {
    let filelist, i;
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
            i = state.filelist.findIndex(f => f.id === action.payload.id);
            filelist = [...state.filelist];
            filelist[i] = Object.assign({}, filelist[i], action.payload);
            return Object.assign({}, state, {filelist: filelist});
        case "MOVE_DOCUMENT":
            const {sourceIndex, destIndex} = action.payload;
            filelist = [...state.filelist];
            const doc = filelist[sourceIndex];
            console.log(sourceIndex, destIndex)
            filelist.splice(sourceIndex, 1);
            filelist.splice(destIndex, 0, doc)
            return Object.assign({}, state, {filelist: filelist});
         case "REMOVE_DOCUMENT":
            i = state.filelist.findIndex(f => f.id === action.payload.id);
            filelist = [...state.filelist];
            filelist.splice(i, 1);
            return Object.assign({}, state, {filelist: filelist});

    }
    return state;
}

const form = (state = {}, action) => {
    switch(action.type){
        case "UPDATE_FORM":
            return Object.assign({}, state, {[action.payload.key]: action.payload.value})
    }
    return state;
}


const rootReducer = combineReducers({
    documents,
    form
});

export default rootReducer;