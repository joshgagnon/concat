import { combineReducers } from 'redux';
import { Action } from './actions.ts'



const filelist = (state = {}, action) => {
    switch(action.type){
    }
    return state;
}

const rootReducer = combineReducers({
    filelist
});

export default rootReducer;