import { combineReducers } from 'redux';
import { Action } from './actions.ts'



const documents = (state = {}, action) => {
    switch(action.type){
    }
    return state;
}

const rootReducer = combineReducers({
    documents
});

export default rootReducer;