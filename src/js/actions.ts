export interface Action<T> {
  type: string
  payload: T
}

interface ActionCreator<T> {
  type: string
  (payload: T): Action<T>
}

const actionCreator = <T>(type: string): ActionCreator<T> =>
  Object.assign((payload: T):any => ({type, payload}), {type})

export const isType = <T>(action: Action<any>, actionCreator: ActionCreator<T>):
  action is Action<T> => action.type === actionCreator.type


//Example action creator:
/*
export interface Response {
  status: boolean
  response: Object
}

*/

export const addDocuments = actionCreator<string>('ADD_DOCUMENTS');
export const updateDocument = actionCreator<string>('UPDATE_DOCUMENT');
export const submitDocuments = actionCreator<string>('SUBMIT_DOCUMENTS');
export const moveDocument = actionCreator<string>('MOVE_DOCUMENT');
export const removeDocument = actionCreator<string>('REMOVE_DOCUMENT');



