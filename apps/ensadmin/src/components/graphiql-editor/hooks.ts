import { useReducer } from "react";

/** The type of the query to execute */
type Query = string;

/** The type of the variables to use for the query */
type Variables = string;

/** The state of the GraphiQL editor */
interface EditorState {
  /** The query to execute */
  query: Query;

  /** The variables to use for the query */
  variables?: Variables;
}

/** The action to set the query */
type SetQueryAction = {
  type: "setQuery";
  payload: string;
};

/** The action to set the query and variables */
type SetQueryAndVariablesAction = {
  type: "setQueryAndVariables";
  payload: {
    query: Query;
    variables: Variables;
  };
};

/** The union of all possible actions */
type Action = SetQueryAction | SetQueryAndVariablesAction;

/** The reducer for the GraphiQL editor state */
function reducer(state: EditorState, action: Action) {
  switch (action.type) {
    case "setQuery":
      return { ...state, query: action.payload, variables: undefined };
    case "setQueryAndVariables":
      return {
        ...state,
        query: action.payload.query,
        variables: action.payload.variables,
      };
  }
}

/** The initial state of the GraphiQL editor */
const defaultInitialState: EditorState = {
  query: "",
};

/**
 * The hook to use the GraphiQL editor state and actions
 * */
export function useGraphiQLEditor(initialState: EditorState = defaultInitialState) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return {
    state,
    actions: {
      setQuery: (query: Query) => {
        dispatch({ type: "setQuery", payload: query });
      },
      setQueryAndVariables: (query: Query, variables: Variables) => {
        dispatch({
          type: "setQueryAndVariables",
          payload: { query, variables },
        });
      },
    },
  };
}
