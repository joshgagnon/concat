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


export const updateResult = actionCreator<string>('UPDATE_RESULT')

export const updateHolidays = actionCreator<string>('UPDATE_HOLIDAYS')

*/